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
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import create_package, get_package, update_checkin
from gemini_service import analyze_transcript, extract_document, generate_narration_script
from elevenlabs_service import text_to_speech
from solana_service import write_to_solana


# ── App Setup ──────────────────────────────────────────────
app = FastAPI(
    title="DeathBox API",
    description="Financial Afterlife Kit — Backend API",
    version="1.0.0"
)

# CORS — allow frontend to call us from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         # Allow all origins for hackathon
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
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not supported. Upload JPEG, PNG, WebP, or PDF."
        )

    # Read the file bytes
    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
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
