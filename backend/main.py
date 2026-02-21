"""
DeathBox — Main API Server
============================
All endpoints live here. Run with:
    uvicorn main:app --reload --port 8000

Endpoints:
    POST /api/analyze       → Person A: Transcript → Structured JSON
    POST /api/extract-doc   → Person A: Document image → Extracted details
    POST /api/seal          → Person B: Save package + hash to Solana
    GET  /api/package/{id}  → Person B: Retrieve package (dead man's switch)
    POST /api/narrate       → Person B: Generate voice narration audio
    POST /api/checkin       → Person B: Reset dead man's switch timer
"""

import json
import uuid
import hashlib
import os
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from db import create_package, get_package, update_checkin
from gemini_service import analyze_transcript, extract_document, generate_narration_script
from elevenlabs_service import text_to_speech
from solana_service import write_to_solana

load_dotenv()

# Frontend integration settings (Phase 6)
ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "*").split(",")
    if origin.strip()
]


# ── App Setup ──────────────────────────────────────────────
app = FastAPI(
    title="DeathBox API",
    description="Financial Afterlife Kit — Backend API",
    version="1.0.0"
)

# CORS — allow frontend to call us from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,  # Use env-configured origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request Models ─────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    transcript: str

class SealRequest(BaseModel):
    package_data: dict
    recipient_name: str
    recipient_email: str
    checkin_days: int = 30

class NarrateRequest(BaseModel):
    package_id: str

class CheckinRequest(BaseModel):
    package_id: str


# ── Integration Helpers ────────────────────────────────────
def _service_status():
    """
    Snapshot of external-service readiness for integration/debugging.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    elevenlabs_voice = os.getenv("ELEVENLABS_VOICE_ID")

    return {
        "gemini_configured": bool(gemini_key and "your_" not in gemini_key.lower()),
        "elevenlabs_configured": bool(elevenlabs_key and "your_" not in elevenlabs_key.lower()),
        "elevenlabs_voice_configured": bool(elevenlabs_voice and "your_" not in elevenlabs_voice.lower()),
        "solana_mode": "placeholder",
        "cors_origins": FRONTEND_ORIGINS,
        "upload_max_mb": MAX_UPLOAD_BYTES // (1024 * 1024),
    }


# ── Health Check ───────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "DeathBox API",
        "status": "alive",
        "endpoints": [
            "POST /api/analyze",
            "POST /api/extract-doc",
            "POST /api/seal",
            "GET  /api/package/{id}",
            "POST /api/narrate",
            "POST /api/checkin",
        ]
    }

@app.get("/api/health")
async def api_health():
    """
    Basic machine-readable health endpoint for frontend/devops checks.
    """
    return {
        "name": "DeathBox API",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/integration-status")
async def api_integration_status():
    """
    Phase 5 endpoint:
    Returns external integration readiness (keys configured, mode, etc.).
    """
    status = _service_status()
    return {
        "status": "ok",
        "services": status,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/frontend-contract")
async def api_frontend_contract():
    """
    Phase 6 endpoint:
    Source-of-truth for frontend payload/response expectations.
    """
    return {
        "status": "ok",
        "base_path": "/api",
        "cors_origins": FRONTEND_ORIGINS,
        "upload": {
            "allowed_mime_types": ALLOWED_UPLOAD_TYPES,
            "max_size_mb": MAX_UPLOAD_BYTES // (1024 * 1024),
            "endpoint": "/api/extract-doc",
            "field_name": "file",
        },
        "contracts": {
            "analyze": {
                "method": "POST",
                "path": "/api/analyze",
                "request": {"transcript": "string"},
                "response_keys": ["found", "missing", "personal_info"],
            },
            "seal": {
                "method": "POST",
                "path": "/api/seal",
                "request_keys": ["package_data", "recipient_name", "recipient_email", "checkin_days"],
                "response_keys": ["package_id", "solana_tx", "hash", "next_checkin", "message"],
            },
            "package": {
                "method": "GET",
                "path": "/api/package/{package_id}?force=true|false",
                "locked_response_keys": ["locked", "message", "unlocks_at", "days_remaining"],
                "unlocked_response_keys": [
                    "locked",
                    "package_id",
                    "package_data",
                    "recipient_name",
                    "created_at",
                    "solana_tx",
                    "package_hash",
                    "verified",
                ],
            },
            "checkin": {
                "method": "POST",
                "path": "/api/checkin",
                "request": {"package_id": "string"},
                "response_keys": ["message", "next_checkin"],
            },
            "narrate": {
                "method": "POST",
                "path": "/api/narrate",
                "request": {"package_id": "string"},
                "success_content_type": "audio/mpeg",
                "fallback_response_keys": ["fallback", "script", "error"],
            },
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


# ══════════════════════════════════════════════════════════
# ENDPOINT 1: ANALYZE TRANSCRIPT (Person A)
# ══════════════════════════════════════════════════════════

@app.post("/api/analyze")
async def api_analyze(req: AnalyzeRequest):
    """
    Frontend sends the voice transcript.
    Gemini extracts structured financial data + detects missing ADP benefits.

    Flow: Frontend → this endpoint → Gemini → structured JSON → Frontend
    """
    if not req.transcript or len(req.transcript.strip()) < 10:
        raise HTTPException(status_code=400, detail="Transcript is too short. Please provide more detail.")

    result = await analyze_transcript(req.transcript)
    return result


# ══════════════════════════════════════════════════════════
# ENDPOINT 2: EXTRACT DOCUMENT (Person A)
# ══════════════════════════════════════════════════════════

@app.post("/api/extract-doc")
async def api_extract_doc(file: UploadFile = File(...)):
    """
    Frontend sends a photo of a financial document (pay stub, benefits statement, etc.).
    Gemini Vision reads the image and extracts account numbers, policy numbers, etc.

    Flow: Frontend uploads image → this endpoint → Gemini Vision → extracted details → Frontend
    """
    # Validate file type
    if file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not supported. Upload JPEG, PNG, WebP, or PDF."
        )

    # Read the file bytes
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    result = await extract_document(image_bytes, mime_type=file.content_type)
    return result


# ══════════════════════════════════════════════════════════
# ENDPOINT 3: SEAL PACKAGE (Person B)
# ══════════════════════════════════════════════════════════

@app.post("/api/seal")
async def api_seal(req: SealRequest):
    """
    Frontend sends the final reviewed package data + recipient info.
    We: generate ID, hash the data, store in DB, write hash to Solana.

    Flow: Frontend → this endpoint → DB + Solana → confirmation → Frontend
    """
    # 1. Generate unique package ID
    pkg_id = f"pkg_{uuid.uuid4().hex[:8]}"

    # 2. Convert package data to deterministic JSON string
    #    sort_keys=True ensures same data always produces same hash
    pkg_json = json.dumps(req.package_data, sort_keys=True)

    # 3. Hash the JSON with SHA-256
    pkg_hash = hashlib.sha256(pkg_json.encode()).hexdigest()

    # 4. Write hash to Solana (calls Solana person's function)
    solana_tx = await write_to_solana(pkg_hash)

    # 5. Save everything to database
    create_package(
        package_id=pkg_id,
        package_data_json=pkg_json,
        recipient_name=req.recipient_name,
        recipient_email=req.recipient_email,
        checkin_days=req.checkin_days,
        solana_tx=solana_tx,
        package_hash=pkg_hash
    )

    # 6. Return confirmation to frontend
    next_checkin = (datetime.utcnow() + timedelta(days=req.checkin_days)).isoformat()

    return {
        "package_id": pkg_id,
        "solana_tx": solana_tx,
        "hash": pkg_hash,
        "next_checkin": next_checkin,
        "message": f"Package sealed. Check in within {req.checkin_days} days."
    }


# ══════════════════════════════════════════════════════════
# ENDPOINT 4: GET PACKAGE — Family View (Person B)
# ══════════════════════════════════════════════════════════

@app.get("/api/package/{package_id}")
async def api_get_package(package_id: str, force: bool = False):
    """
    Family member opens their access link. We check the dead man's switch.
    If the timer has expired (or force=true for demo), serve the package.

    Flow: Family clicks link → this endpoint → DB check → package data → Frontend
    """
    # 1. Look up the package
    pkg = get_package(package_id)
    if pkg is None:
        raise HTTPException(status_code=404, detail="Package not found.")

    # 2. Check the dead man's switch
    last_checkin = datetime.fromisoformat(pkg["last_checkin"])
    deadline = last_checkin + timedelta(days=pkg["checkin_days"])
    now = datetime.utcnow()

    if not force and now < deadline:
        # Package is still locked — user is presumably still alive
        return {
            "locked": True,
            "message": "Package is still locked. The owner has been checking in.",
            "unlocks_at": deadline.isoformat(),
            "days_remaining": (deadline - now).days
        }

    # 3. Package is unlocked — serve it
    return {
        "locked": False,
        "package_id": pkg["id"],
        "package_data": pkg["package_data"],
        "recipient_name": pkg["recipient_name"],
        "created_at": pkg["created_at"],
        "solana_tx": pkg["solana_tx"],
        "package_hash": pkg["package_hash"],
        "verified": True
    }


# ══════════════════════════════════════════════════════════
# ENDPOINT 5: NARRATE — Voice Walkthrough (Person B + Person A)
# ══════════════════════════════════════════════════════════

@app.post("/api/narrate")
async def api_narrate(req: NarrateRequest):
    """
    Family clicks "Listen to Voice Walkthrough".
    We: load the package → Person A generates script via Gemini → Person B sends to ElevenLabs → MP3 back.

    Flow: Frontend → this endpoint → Gemini (script) → ElevenLabs (audio) → MP3 → Frontend
    """
    # 1. Load the package from DB
    pkg = get_package(req.package_id)
    if pkg is None:
        raise HTTPException(status_code=404, detail="Package not found.")

    # 2. Generate narration script (Person A's function)
    script = await generate_narration_script(pkg["package_data"])

    # 3. Convert script to audio (Person B's function)
    try:
        audio_bytes = await text_to_speech(script)
    except Exception as e:
        # If ElevenLabs fails, return the script as text so frontend can at least display it
        return {
            "fallback": True,
            "script": script,
            "error": str(e)
        }

    # 4. Return audio as MP3 stream
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f"inline; filename=deathbox_narration_{req.package_id}.mp3"
        }
    )


# ══════════════════════════════════════════════════════════
# ENDPOINT 6: CHECK-IN — Dead Man's Switch Reset (Person B)
# ══════════════════════════════════════════════════════════

@app.post("/api/checkin")
async def api_checkin(req: CheckinRequest):
    """
    The living user confirms they're alive. Reset the timer.

    Flow: User opens app → presses check-in → this endpoint → DB update → confirmation
    """
    success = update_checkin(req.package_id)

    if not success:
        raise HTTPException(status_code=404, detail="Package not found.")

    pkg = get_package(req.package_id)
    next_checkin = (datetime.utcnow() + timedelta(days=pkg["checkin_days"])).isoformat()

    return {
        "message": "Check-in successful. You're still with us.",
        "next_checkin": next_checkin
    }


# ══════════════════════════════════════════════════════════
# Run the server
# ══════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 DeathBox API starting on http://localhost:8000\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
