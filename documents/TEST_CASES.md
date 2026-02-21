# DeathBox — Test Cases

## Test 1: Health Check

**Endpoint:** `GET http://localhost:8000/`
**Expected:** `{ "name": "DeathBox API", "status": "alive", "endpoints": [...] }`

---

## Test 2: Analyze Transcript — Clean (no speech errors)

**Endpoint:** `POST http://localhost:8000/api/analyze`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "transcript": "I work at Acme Corp, been there about 3 years. My wife is Sarah. Okay so for bank accounts, I have a checking account with Chase with around 8 thousand dollars and a savings account with Bank of America with maybe 15 grand in it. For investments, I have a 401k through Fidelity, my company matches 4 percent, I think theres about 45 thousand in there. I also have a Robinhood account where I buy stocks, maybe 6 thousand worth. I put some money in crypto too, maybe 2 thousand in Coinbase. For insurance, I have health insurance through Anthem from my employer. I think they give us life insurance too but honestly I dont remember how much. I also have car insurance through Geico and I pay for a term life policy through State Farm, 500K coverage. For credit cards, I have a Chase Sapphire card with about 3 thousand balance and a Discover card with like 1200 on it. For loans I have taken, I have a car loan about 14K left through Capital One, and student loans about 28 thousand federal through Navient. I also have a mortgage, 280K remaining with Wells Fargo. And for loans I have given to people, I lent my brother Mike 5 thousand dollars last year and my friend Dave owes me 2 thousand. I also pay for Netflix, Spotify, and my gym membership."
}
```
**Expected:** 16 found items across all 6 categories, 5 missing items, personal_info with spouse "Sarah"

---

## Test 3: Analyze Transcript — With Speech Errors & Mispronunciations

This simulates what ElevenLabs STT might actually produce — misspelled company names, garbled words, filler words, run-on sentences.

**Endpoint:** `POST http://localhost:8000/api/analyze`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "transcript": "Um so yeah I work at uh Acme Corp been there like 3 years or so. My wifes name is Sara. Okay so uh for bank stuff I got a checking acount at Chaise, theres like around 8 thousand bucks in there and um a savings acount at Bank of Amerika with like maybe 15 grand I think. For investments um I have a four oh one kay through Fidellity, my company matches like 4 per cent I think theres about fourty five thousand in there. I also use Robinhood to buy like stocks and stuff maybe 6 thousand worth. Oh and I put some money in Coinbase like crypto stuff maybe two grand. For insurance uh I have helth insurance through Antem from work. I think they give us like life insurance too but like honestly I dont know how much you know. I also got car insurance from Guyco and I pay for a term life thing through Statefarm, five hundred K coverage I think. For credit cards I got a Chase Saphire card with like 3 thousand on it and a Diskover card with like twelve hundred. For loans uh I got a car lone about forteen K left through Capitalone, and like student loans about twenty eight thousand federal ones through Nayvient. Also got a morgage, two eighty K left with Wellsfargo. And uh for money I lent to people my brother Micheal owes me 5 thousand from last year and my freind Dave owes me like 2 thousand. I also pay for Netflicks and Spotifi and my gym membrship."
}
```
**Expected:** Gemini should correct ALL misspellings:
- "Chaise" → Chase
- "Bank of Amerika" → Bank of America
- "Fidellity" → Fidelity
- "Antem" → Anthem
- "Guyco" → Geico
- "Statefarm" → State Farm
- "Saphire" → Sapphire
- "Diskover" → Discover
- "Capitalone" → Capital One
- "Nayvient" → Navient
- "Wellsfargo" → Wells Fargo
- "Netflicks" → Netflix
- "Spotifi" → Spotify
- "fourty five thousand" → 45000
- "forteen K" → 14000
- "twenty eight thousand" → 28000
- "two eighty K" → 280000
- "twelve hundred" → 1200
- "five hundred K" → 500000
- Should ignore "um", "uh", "like", "you know", "or so"

---

## Test 4: Analyze Transcript — Vague / Minimal Info

Tests how Gemini handles a user who barely knows their finances.

**Endpoint:** `POST http://localhost:8000/api/analyze`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "transcript": "I work at some company I think its called Tekflow or something. I have some kind of retirement thing I think maybe a four oh one kay but I dont really know. I think we get insurance from work. I owe money on some stuff. My girlfriend is Mia."
}
```
**Expected:**
- Very few found items, all with "vague" or "uncertain" confidence
- Many missing items across all 6 categories
- personal_info should extract "Tekflow" (corrected to "TechFlow" if possible) and "Mia"

---

## Test 5: Analyze Transcript — Heavy Accent / Broken Speech

Simulates someone speaking quickly with a heavy accent, words running together.

**Endpoint:** `POST http://localhost:8000/api/analyze`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "transcript": "Ok so I been working at Walmart for like 5 years yeah. I got a bank acount at Wells Fargo I think theres maybe like ten grand in there. I also got a CD at Ally bank maybe 5 thousand. I got four oh one K Im not sure the provider maybe its like Vangard or something. I got Whole life insurance from New York Life like 200 thousand policy. I got helth insurance I pay like 400 a month. I got 2 credit cards ones a Visa from Capital One bout 4 thousand balance and a Mastercard from city bank bout 2 thousand. I took a personal lone from Sofi like 8 thousand left. And yeah I lent money to my cousin Raj like 3 thousand hes supposed to pay me back. My wife is Priya she should get everything."
}
```
**Expected:** Gemini should correct:
- "Vangard" → Vanguard
- "city bank" → Citibank
- "Sofi" → SoFi
- "lone" → loan
- "helth" → health
- "acount" → account
- Should extract: bank account (Wells Fargo $10K), CD (Ally $5K), 401k (Vanguard), whole life (New York Life $200K), health insurance, 2 credit cards, personal loan (SoFi $8K), loan given (cousin Raj $3K)

---

## Test 6: Analyze Transcript — Only Debts, No Assets

Edge case: user only talks about debts.

**Endpoint:** `POST http://localhost:8000/api/analyze`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "transcript": "I dont really have much savings honestly. I owe like 45 thousand on student loans through federal. I got a car payment 18 thousand left at Toyota Financial. I got credit card debt, um a Visa at Bank of America with like 8 thousand and an American Express with 5 thousand. I also borrowed 3 thousand from a payday lender I think it was called Check Into Cash. My buddy Jason owes me like a thousand bucks but I doubt hes gonna pay. I work at Target by the way been there 2 years. My mom should know about all this shes my emergency contact her name is Linda."
}
```
**Expected:**
- Found items: mostly loans_taken and credit_cards
- Missing items should flag: bank accounts (critical — family needs money for immediate expenses), investments, insurance, etc.
- personal_info: employer "Target", emergency contact "Linda (mother)"

---

## Test 7: Seal Package

**Endpoint:** `POST http://localhost:8000/api/seal`
**Headers:** `Content-Type: application/json`
**Body:** (use the response from any Test 2-6 as package_data)
```json
{
  "package_data": {
    "found": [
      {"type": "bank_account", "bank_name": "Chase", "balance": 8000},
      {"type": "investment", "provider": "Fidelity", "investment_type": "401k"},
      {"type": "insurance", "provider": "State Farm", "coverage": 500000},
      {"type": "credit_card", "issuer": "Chase", "balance_owed": 3000},
      {"type": "loan_taken", "lender": "Wells Fargo", "balance_remaining": 280000},
      {"type": "loan_given", "borrower_name": "Mike", "amount": 5000}
    ],
    "missing": [{"type": "pto_accrued", "urgency": "critical"}],
    "personal_info": {"employer": "Acme Corp", "spouse": "Sarah"}
  },
  "recipient_name": "Sarah",
  "recipient_email": "sarah@example.com",
  "checkin_days": 30
}
```
**Expected:** Returns `package_id`, `solana_tx`, `hash`, `next_checkin`. **Copy the package_id.**

---

## Test 8: Get Package — Locked

**Endpoint:** `GET http://localhost:8000/api/package/<PACKAGE_ID>`
**Expected:** `{ "locked": true, "days_remaining": 29, "unlocks_at": "..." }`

---

## Test 9: Get Package — Force Unlock (Demo)

**Endpoint:** `GET http://localhost:8000/api/package/<PACKAGE_ID>?force=true`
**Expected:** `{ "locked": false, "package_data": {...}, "verified": true }`

---

## Test 10: Check-in

**Endpoint:** `POST http://localhost:8000/api/checkin`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "package_id": "<PACKAGE_ID>"
}
```
**Expected:** `{ "message": "Check-in successful. You're still with us.", "next_checkin": "..." }`

---

## Test 11: Narrate

**Endpoint:** `POST http://localhost:8000/api/narrate`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "package_id": "<PACKAGE_ID>"
}
```
**Expected (without ElevenLabs key):** `{ "fallback": true, "script": "Hi Sarah. I know this is...", "error": "..." }`
**Expected (with ElevenLabs key):** Raw MP3 audio bytes (save as .mp3 and play)

---

## Test 12: Extract Document

**Endpoint:** `POST http://localhost:8000/api/extract-doc`
**Body type:** form-data
- Key: `file` (type: File)
- Value: upload any image of a financial document (pay stub, bank statement, etc.)

**Expected:** `{ "extracted": [...], "document_type": "...", "institution_name": "..." }`

---

## Test Results Log

| Test | Status | Response Time | Notes |
|---|---|---|---|
| Test 1: Health Check | PASS | <100ms | Server running |
| Test 2: Clean Transcript | PASS | ~2-4s | 16 found, 5 missing |
| Test 3: Misspelled Transcript | TBD | ~3-8s | Check Gemini corrects all errors |
| Test 4: Vague Transcript | TBD | ~2-5s | Should return many missing items |
| Test 5: Accent/Broken Speech | TBD | ~3-8s | Test speech error correction |
| Test 6: Only Debts | TBD | ~2-5s | Should flag missing bank accounts |
| Test 7: Seal Package | PASS | <1s | Got package_id |
| Test 8: Get Locked | PASS | <100ms | Locked with days_remaining |
| Test 9: Force Unlock | PASS | <100ms | Full package data returned |
| Test 10: Check-in | PASS | <100ms | Timer reset |
| Test 11: Narrate | TBD | ~5-15s | Depends on ElevenLabs key |
| Test 12: Extract Doc | TBD | ~3-10s | Needs image file |
