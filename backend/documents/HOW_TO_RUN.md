# DeathBox — How to Run & Test

## Prerequisites

- Python 3.12+ installed
- Postman (for testing APIs) — download from https://www.postman.com
- A Gemini API key (free) — https://aistudio.google.com → "Get API Key"
- (Optional) ElevenLabs API key — https://elevenlabs.io → Profile → API Key

## Step 1: Setup

```bash
# Navigate to the project
cd /Users/shwetamalabade/Downloads/deathbox-backend

# Install dependencies
pip3 install -r requirements.txt
```

## Step 2: Configure API Keys

Edit the `.env` file:
```
GEMINI_API_KEY=your_real_gemini_key_here
ELEVENLABS_API_KEY=your_real_elevenlabs_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

Note: Without the Gemini key, /api/analyze will fall back to mock data. Without ElevenLabs key, /api/narrate will return the script as text instead of audio.

## Step 3: Start the Server

```bash
python3 main.py
```

You should see:
```
✅ Database initialized
🚀 DeathBox API starting on http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal open.** It shows live logs as you hit endpoints.

**If you see "Address already in use":**
```bash
# Kill whatever is using port 8000
lsof -ti:8000 | xargs kill -9
# Then start again
python3 main.py
```

## Step 4: Test in Postman (Follow This Order)

### 4.1 — Health Check
- Method: **GET**
- URL: `http://localhost:8000/`
- Click Send
- Should see: `"status": "alive"`

### 4.2 — Analyze Transcript
- Method: **POST**
- URL: `http://localhost:8000/api/analyze`
- Go to **Body → raw → JSON**
- Paste this:

```json
{
  "transcript": "Um so yeah I work at uh Acme Corp been there like 3 years or so. My wifes name is Sara. Okay so uh for bank stuff I got a checking acount at Chaise, theres like around 8 thousand bucks in there and um a savings acount at Bank of Amerika with like maybe 15 grand I think. For investments um I have a four oh one kay through Fidellity, my company matches like 4 per cent I think theres about fourty five thousand in there. I also use Robinhood to buy like stocks and stuff maybe 6 thousand worth. Oh and I put some money in Coinbase like crypto stuff maybe two grand. For insurance uh I have helth insurance through Antem from work. I think they give us like life insurance too but like honestly I dont know how much you know. I also got car insurance from Guyco and I pay for a term life thing through Statefarm, five hundred K coverage I think. For credit cards I got a Chase Saphire card with like 3 thousand on it and a Diskover card with like twelve hundred. For loans uh I got a car lone about forteen K left through Capitalone, and like student loans about twenty eight thousand federal ones through Nayvient. Also got a morgage, two eighty K left with Wellsfargo. And uh for money I lent to people my brother Micheal owes me 5 thousand from last year and my freind Dave owes me like 2 thousand. I also pay for Netflicks and Spotifi and my gym membrship."
}
```
- Click Send
- Wait 3-8 seconds
- **What to check:**
  - All company names should be spelled correctly in the response (Chase, not Chaise)
  - Numbers should be correct (14000, not "forteen K")
  - Should have items in all 6 categories
  - Each item has confidence level and warnings

### 4.3 — Seal Package
- Method: **POST**
- URL: `http://localhost:8000/api/seal`
- Body → raw → JSON:

```json
{
  "package_data": {
    "found": [
      {"type": "bank_account", "bank_name": "Chase", "balance": 8000, "confidence": "certain"},
      {"type": "bank_account", "bank_name": "Bank of America", "balance": 15000, "confidence": "uncertain"},
      {"type": "investment", "provider": "Fidelity", "investment_type": "401k", "confidence": "uncertain"},
      {"type": "insurance", "provider": "State Farm", "policy_type": "term_life", "coverage": 500000},
      {"type": "credit_card", "issuer": "Chase", "card_name": "Sapphire", "balance_owed": 3000},
      {"type": "loan_taken", "lender": "Wells Fargo", "loan_type": "mortgage", "balance_remaining": 280000},
      {"type": "loan_given", "borrower_name": "Mike (brother)", "amount": 5000}
    ],
    "missing": [
      {"type": "pto_accrued", "urgency": "critical"},
      {"type": "ad_and_d_insurance", "urgency": "high"}
    ],
    "personal_info": {"employer": "Acme Corp", "years_employed": 3, "spouse": "Sarah"}
  },
  "recipient_name": "Sarah",
  "recipient_email": "sarah@example.com",
  "checkin_days": 30
}
```
- Click Send
- **COPY the `package_id` from the response** (you need it for the next steps)

### 4.4 — Get Package (Locked)
- Method: **GET**
- URL: `http://localhost:8000/api/package/YOUR_PACKAGE_ID`
- Replace YOUR_PACKAGE_ID with the ID from step 4.3
- Should see: `"locked": true`

### 4.5 — Get Package (Force Unlock — Demo Mode)
- Method: **GET**
- URL: `http://localhost:8000/api/package/YOUR_PACKAGE_ID?force=true`
- Should see: `"locked": false` with full package data

### 4.6 — Check-in
- Method: **POST**
- URL: `http://localhost:8000/api/checkin`
- Body → raw → JSON:
```json
{
  "package_id": "YOUR_PACKAGE_ID"
}
```
- Should see: "Check-in successful"

### 4.7 — Narrate (Voice Walkthrough)
- Method: **POST**
- URL: `http://localhost:8000/api/narrate`
- Body → raw → JSON:
```json
{
  "package_id": "YOUR_PACKAGE_ID"
}
```
- **Without ElevenLabs key:** Returns JSON with `"fallback": true` and the script text
- **With ElevenLabs key:** Returns MP3 audio — click "Save Response → Save to File" → save as .mp3 → play it

## Step 5: Swagger UI (Alternative to Postman)

Open `http://localhost:8000/docs` in your browser. FastAPI auto-generates an interactive API tester. You can click any endpoint, fill in the body, and press "Try it out" → "Execute".

## Step 6: Automated Test Script

```bash
# Make sure server is running in another terminal first
python3 test_endpoints.py
```

This runs Tests 1-5 automatically with colored output.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Address already in use" | Run: `lsof -ti:8000 \| xargs kill -9` then restart |
| "ModuleNotFoundError" | Run: `pip3 install -r requirements.txt` |
| Gemini returns mock data | Check your GEMINI_API_KEY in .env is real |
| Slow response (>10s) | Normal for first Gemini call. Subsequent calls are faster. |
| "Gemini returned invalid JSON" | The prompt handles this — falls back to mock data |
| Narrate returns fallback | Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env |
| Server won't start | Check Python version: `python3 --version` (need 3.12+) |
