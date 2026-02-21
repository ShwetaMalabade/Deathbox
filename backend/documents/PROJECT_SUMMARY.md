# DeathBox Backend — Project Summary

## What Is DeathBox?

DeathBox is a "Financial Afterlife Kit." It lets users record their complete financial picture through voice conversations while they're alive. When they die (detected via a dead man's switch — no check-in for N days), the system delivers an organized "Afterlife Package" to their designated family member, complete with a voice walkthrough.

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Backend Framework | FastAPI (Python) | 0.115.0 |
| Server | Uvicorn | 0.30.6 |
| AI / LLM | Google Gemini 2.0 Flash | via google-generativeai 0.8.3 |
| Text-to-Speech | ElevenLabs API | eleven_multilingual_v2 model |
| Database | SQLite | Built-in Python |
| Blockchain | Solana (placeholder) | Devnet — fake tx for now |
| HTTP Client | httpx | 0.27.2 |
| Environment | python-dotenv | 1.0.1 |
| Python | 3.12.9 | macOS (darwin) |

## Environment Setup (.env)

```
GEMINI_API_KEY=<your-google-gemini-api-key>
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
ELEVENLABS_VOICE_ID=<voice-id-from-elevenlabs-dashboard>
```

- Gemini key: Get from https://aistudio.google.com → "Get API Key"
- ElevenLabs key: Get from https://elevenlabs.io → Profile → API Key
- Voice ID: ElevenLabs → Voices → Pick one → Copy the ID (not the name)

## File Structure

```
deathbox-backend/
├── main.py                 # FastAPI app — all 6 endpoints
├── gemini_service.py       # Gemini AI — 3 functions (analyze, extract-doc, narrate)
├── db.py                   # SQLite database — 1 table, 3 functions
├── elevenlabs_service.py   # ElevenLabs TTS — text_to_speech()
├── solana_service.py       # Solana placeholder — write_to_solana()
├── mock_data.py            # Hardcoded fallback data for demo
├── requirements.txt        # Python dependencies
├── .env                    # API keys (never commit)
├── test_endpoints.py       # Automated test script
├── deathbox.db             # SQLite DB file (auto-created)
└── documents/              # This documentation folder
```

## 6 API Endpoints

| # | Method | URL | What It Does |
|---|---|---|---|
| 1 | GET | `/` | Health check — confirms server is alive |
| 2 | POST | `/api/analyze` | Sends voice transcript → Gemini extracts structured financial JSON |
| 3 | POST | `/api/extract-doc` | Uploads document image → Gemini Vision reads it |
| 4 | POST | `/api/seal` | Saves package + SHA-256 hash + writes to Solana |
| 5 | GET | `/api/package/{id}` | Retrieves package (checks dead man's switch) |
| 6 | POST | `/api/narrate` | Generates voice narration (Gemini script → ElevenLabs audio) |
| 7 | POST | `/api/checkin` | Resets dead man's switch timer |

## 6 Target Categories

The AI extracts financial data into these categories:

1. **Bank Accounts** (`bank_account`) — Checking, savings, CDs, money market
2. **Investments** (`investment`) — 401k, IRA, stocks, crypto, brokerage, RSUs
3. **Insurance Policies** (`insurance`) — Life, health, auto, home, disability, AD&D
4. **Active Credit Cards** (`credit_card`) — All cards with balances
5. **Loans Taken** (`loan_taken`) — Mortgage, car loan, student loans, personal loans
6. **Loans Given** (`loan_given`) — Money lent to friends/family

## Gemini API Details

- **Model**: `gemini-2.0-flash`
- **Library**: `google-generativeai` Python SDK
- **3 Functions**:
  - `analyze_transcript(transcript)` → Text-only → Returns structured JSON
  - `extract_document(image_bytes, mime_type)` → Multimodal (Vision) → Reads document images
  - `generate_narration_script(package_data)` → Text-only → Returns warm narration script
- **Timeout**: 15 seconds per call, falls back to mock data on failure
- **Speech Error Handling**: Prompt corrects misspellings from speech-to-text (Fidellity→Fidelity, Chaise→Chase, etc.)

## Data Flow

```
Phase 1 (While Alive):
User speaks → ElevenLabs STT (frontend) → transcript text
  → POST /api/analyze → Gemini extracts structured JSON → frontend shows checklist
  → User uploads doc → POST /api/extract-doc → Gemini Vision reads it → fills gaps
  → User confirms → POST /api/seal → DB + Solana hash → package sealed
  → User periodically → POST /api/checkin → timer reset

Phase 2 (After Death):
Timer expires → family gets link
  → GET /api/package/{id} → full financial data
  → POST /api/narrate → Gemini writes script → ElevenLabs speaks it → MP3 audio
```

## What We Built / Changed

### Initial Generated Code
- `main.py` with 6 endpoints and proper CORS, error handling, Pydantic models
- `gemini_service.py` with 3 Gemini functions + timeout + mock fallback
- `db.py` with SQLite (packages table) and 3 helper functions
- `elevenlabs_service.py` with TTS API call
- `solana_service.py` as a placeholder returning fake tx hashes
- `mock_data.py` with ADP-focused fallback data
- `test_endpoints.py` for automated testing

### Updates Made
1. **Expanded ANALYZE_PROMPT** — From ADP-only to all 6 financial categories
2. **Added speech-to-text error handling** — Gemini now corrects mispronunciations, handles casual speech, filler words
3. **Updated EXTRACT_DOC_PROMPT** — Now handles bank statements, credit card statements, loan docs (not just pay stubs)
4. **Updated NARRATION_PROMPT** — Walks family through all 6 categories in urgency order, explains which debts they're NOT responsible for
5. **Rewrote mock_data.py** — 16 found items across all 6 categories (was 6 ADP items)
6. **Renamed `employee_info` to `personal_info`** — Broader scope to include family members mentioned

## Database Schema

```sql
CREATE TABLE packages (
    id              TEXT PRIMARY KEY,    -- "pkg_abc123"
    package_data    TEXT NOT NULL,       -- JSON string
    recipient_name  TEXT NOT NULL,       -- "Sarah"
    recipient_email TEXT NOT NULL,       -- "sarah@email.com"
    checkin_days    INTEGER DEFAULT 30,  -- days before release
    last_checkin    TEXT NOT NULL,       -- ISO timestamp
    created_at      TEXT NOT NULL,       -- ISO timestamp
    solana_tx       TEXT,                -- tx signature
    package_hash    TEXT                 -- SHA-256 hash
);
```
