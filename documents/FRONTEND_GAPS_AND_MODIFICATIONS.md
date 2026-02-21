# DeathBox — Frontend Gaps & Modifications

## Current Screens (What Exists)

```
Screen 1 → Landing
Screen 2 → Setup
Screen 3 → Recording (voice input)
Screen 4 → Processing (Gemini animation)
Screen 5 → Benefits Checklist (found + missing)
Screen 6 → Sealed (vault + Solana hash)
Screen 7 → Family Intro (30 days later)
Screen 8 → Family Package (urgency cards)
Screen 9 → Voice Player (narration)
```

## The Big Gap: No Way to Fill Missing Items

Right now, Screen 5 shows what's missing but the user just clicks through to Screen 6 (Seal). There's no loop where the user can **fix the gaps before sealing**. This is the most critical missing piece.

The backend already supports this:
- `POST /api/analyze` — accepts text/voice transcript, returns updated data
- `POST /api/extract-doc` — accepts document image, returns extracted details

The frontend just needs to connect to these.

---

## Modified Flow (10 Screens)

```
Screen 1  → Landing
Screen 2  → Setup
Screen 3  → Recording (voice input)
Screen 4  → Processing (Gemini animation)
Screen 5  → Financial Checklist (found + missing) ← MODIFIED
Screen 5B → Gap Filler (chat/voice/upload loop) ← NEW SCREEN
Screen 6  → Review & Seal ← MODIFIED
Screen 7  → Family Intro (30 days later)
Screen 8  → Family Package (urgency cards) ← MODIFIED
Screen 9  → Voice Player (narration)
```

---

## Screen-by-Screen Modifications

### Screen 3 — Recording (MINOR UPDATE)

**Current:** User records voice, transcript appears.

**Add:** After recording ends, show a small text input at the bottom:
- "Prefer to type? Add anything you missed here"
- Text area where user can type additional info
- Both the voice transcript AND typed text get combined and sent to `POST /api/analyze`

**Why:** Some users might remember something after recording, or might not want to say sensitive info out loud (like "I owe my bookie 5 grand").

**Backend call:**
```
POST /api/analyze
Body: { "transcript": "<voice transcript> <typed text combined>" }
```

---

### Screen 5 — Financial Checklist (MAJOR UPDATE)

**Current:** Static display of found (green) and missing (red) items. User just views and moves on.

**Change to:** Interactive checklist where every item is clickable/actionable.

**Layout — 6 Category Sections:**

The checklist should be organized into 6 sections (matching our backend categories):

```
┌─────────────────────────────────────────────┐
│  1. 🏦 BANK ACCOUNTS                        │
│  ┌──────────────────────────────────────┐   │
│  │ ✅ Chase Checking — ~$8,000          │   │
│  │    Confidence: Certain               │   │
│  │    ⚠️ Account number unknown         │   │
│  │    [Add Details] [Upload Statement]  │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ ✅ Bank of America Savings — ~$15K   │   │
│  │    Confidence: Uncertain (you said   │   │
│  │    "maybe 15 grand")                 │   │
│  │    [Correct Amount] [Upload Doc]     │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  2. 📈 INVESTMENTS                           │
│  ┌──────────────────────────────────────┐   │
│  │ ✅ Fidelity 401k — Balance unknown   │   │
│  │    ⚠️ Beneficiary not specified      │   │
│  │    [Add Details] [Upload Doc]        │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  3. 🛡️ INSURANCE POLICIES                   │
│  ┌──────────────────────────────────────┐   │
│  │ ⚠️ Employer Life Insurance — VAGUE   │   │
│  │    You said "I think they give us    │   │
│  │    some" — amount & provider unknown │   │
│  │    [Tell us more] [Upload Doc]       │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ ❌ AD&D Insurance — NOT MENTIONED    │   │
│  │    90% of workers have this and      │   │
│  │    don't know. Could be $50K-$150K.  │   │
│  │    [I have this] [I don't know]      │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  4. 💳 CREDIT CARDS                         │
│  ...                                        │
├─────────────────────────────────────────────┤
│  5. 📉 LOANS TAKEN                          │
│  ...                                        │
├─────────────────────────────────────────────┤
│  6. 🤝 LOANS GIVEN                          │
│  ...                                        │
└─────────────────────────────────────────────┘
```

**Each item card has:**
- Status icon: ✅ (found, certain), ⚠️ (found but vague/uncertain), ❌ (missing)
- What was detected + confidence level
- Specific warnings from the backend (deadlines, legal info)
- Action buttons:
  - **[Add Details]** → opens the Gap Filler (Screen 5B) for that item
  - **[Upload Doc]** → opens file picker, sends to `POST /api/extract-doc`
  - **[Correct]** → lets user fix wrong amounts or names
  - **[I don't have this]** → dismisses a missing item

**Bottom of checklist:**
```
┌──────────────────────────────────────────────┐
│  📊 Your Package Completeness: 68%           │
│  ████████████░░░░░░░░                        │
│                                              │
│  5 items need attention                      │
│  [Fill Gaps Now]     [Seal Anyway →]         │
└──────────────────────────────────────────────┘
```

- "Fill Gaps Now" → goes to Screen 5B
- "Seal Anyway" → goes to Screen 6 (with a warning: "Some items are incomplete. Your family will see 'unknown' for these fields.")

**Data source:** The entire checklist renders from the response of `POST /api/analyze`:
```json
{
  "found": [...],    // render as ✅ and ⚠️ cards
  "missing": [...],  // render as ❌ cards
  "personal_info": {...}
}
```

---

### Screen 5B — Gap Filler (NEW SCREEN)

This is the critical new screen. It's a conversation-style interface where the user fills in missing info.

**Layout:**

```
┌──────────────────────────────────────────────┐
│  ← Back to Checklist                         │
│                                              │
│  Let's fill in the gaps                      │
│  5 items need your attention                 │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 🤖 DeathBox:                             │ │
│ │ "You mentioned life insurance from your  │ │
│ │  employer but didn't know the amount or  │ │
│ │  provider. Can you check your benefits   │ │
│ │  portal or a recent pay stub? You can    │ │
│ │  tell me, type it, or upload a photo."   │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 👤 You:                                  │ │
│ │ "Oh yeah I just checked, it's through    │ │
│ │  MetLife, 150 thousand coverage. Policy  │ │
│ │  number is GL-49201."                    │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 🤖 DeathBox:                             │ │
│ │ "Got it — MetLife, $150,000, policy      │ │
│ │  GL-49201. ✅ Updated!                   │ │
│ │                                          │ │
│ │  Next: You didn't mention if you have    │ │
│ │  any accrued PTO or vacation days at     │ │
│ │  Acme Corp. In many states, this MUST    │ │
│ │  be paid out to your estate."            │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ [🎙 Voice]  [⌨️ Type here...]  [📎 Upload]│ │
│ └──────────────────────────────────────────┘ │
│                                              │
│  Items remaining: 3 of 5                     │
│  [Skip remaining → Seal]                     │
└──────────────────────────────────────────────┘
```

**Three input methods side by side:**

1. **🎙 Voice button** — Hold to record, release to send
   - Records audio → ElevenLabs STT (on frontend) → transcript
   - Sends transcript to `POST /api/analyze`
   - Backend returns updated found/missing data
   - Frontend merges into the existing package data

2. **⌨️ Text input** — Type and hit enter
   - Sends typed text to `POST /api/analyze`
   - Same flow as voice

3. **📎 Upload button** — Opens camera/file picker
   - User takes photo of pay stub, insurance card, bank statement, etc.
   - Sends image to `POST /api/extract-doc`
   - Backend returns extracted details (account numbers, policy numbers, etc.)
   - Frontend merges extracted data into existing package

**The conversation flow:**
1. DeathBox asks about the FIRST missing item (highest urgency first)
2. User responds via voice, text, or upload
3. Frontend sends to backend, gets response
4. DeathBox confirms what it understood, shows ✅
5. Moves to the NEXT missing item
6. Repeat until all gaps are filled or user clicks "Skip remaining → Seal"

**How to build the conversation prompts:**
For each item in the `missing` array from the backend, generate a question:

| Missing Type | Question to Show |
|---|---|
| Life insurance (vague) | "You mentioned life insurance but didn't know the amount. Can you check your benefits portal or upload a pay stub?" |
| PTO accrued | "You didn't mention vacation days. Do you know how many PTO days you've accrued at [employer]?" |
| AD&D insurance | "Most employers include AD&D insurance but 90% of workers don't know. Check your benefits statement — it's usually bundled with life insurance." |
| Bank accounts (missing) | "You didn't mention any bank accounts. Do you have checking or savings accounts?" |
| Credit cards (missing) | "Do you have any active credit cards with balances?" |

For items that are "found" but have `confidence: "vague"` or `confidence: "uncertain"`, also prompt:

| Found Item | Question to Show |
|---|---|
| 401k with unknown balance | "You mentioned a 401k at Fidelity but weren't sure of the balance. Do you know the approximate amount?" |
| HSA with unknown beneficiary | "Your HSA has ~$2,000 but no beneficiary named. Do you know who your HSA beneficiary is?" |

**Backend calls from this screen:**
```
// When user provides voice/text info about a missing item
POST /api/analyze
Body: { "transcript": "My life insurance is through MetLife, 150 thousand dollars, policy number GL-49201" }
Response: { "found": [...updated items...], "missing": [...fewer items now...] }

// When user uploads a document
POST /api/extract-doc
Body: form-data with image file
Response: { "extracted": [...], "document_type": "pay_stub" }
```

**Merging logic (frontend responsibility):**
When the backend returns new data from a gap-filling call, the frontend should:
1. Take the new `found` items
2. Merge them into the existing package_data (replace "unknown" fields with real values)
3. Remove items from the `missing` list that are now filled
4. Update the progress bar (e.g., 68% → 85%)
5. Show the confirmation in the chat

---

### Screen 6 — Review & Seal (MINOR UPDATE)

**Current:** Goes straight to sealing.

**Add a review step before sealing:**

```
┌──────────────────────────────────────────────┐
│  📋 Review Your Package Before Sealing       │
│                                              │
│  Package Completeness: 92% ██████████░       │
│                                              │
│  ✅ 12 items fully documented                │
│  ⚠️ 2 items partially documented             │
│  ❌ 1 item still unknown                     │
│                                              │
│  👤 Recipient: Sarah (sarah@email.com)       │
│  ⏰ Check-in interval: 30 days               │
│                                              │
│  [← Go Back & Fix]    [🔒 Seal Package]      │
│                                              │
│  ⚠️ Items marked unknown will show as        │
│  "check with HR" in the family package.      │
└──────────────────────────────────────────────┘
```

**Add these fields before sealing (if not already collected):**
- Recipient name input
- Recipient email input
- Check-in interval dropdown (7 / 14 / 30 / 60 / 90 days)

**Backend call when user clicks "Seal Package":**
```
POST /api/seal
Body: {
  "package_data": { ...the complete merged data from all steps... },
  "recipient_name": "Sarah",
  "recipient_email": "sarah@example.com",
  "checkin_days": 30
}
Response: { "package_id": "pkg_xxx", "solana_tx": "...", "hash": "..." }
```

---

### Screen 8 — Family Package (MINOR UPDATE)

**Current:** Shows urgency-coded cards for ADP benefits only.

**Update to show all 6 categories:**

```
┌──────────────────────────────────────────────┐
│  🔴 URGENT — DO THESE WITHIN 60 DAYS        │
│  • Elect COBRA health insurance              │
│  • File life insurance claim ($500K)         │
│  • Check 401k beneficiary at Fidelity        │
├──────────────────────────────────────────────┤
│  🏦 BANK ACCOUNTS                            │
│  • Chase Checking — ~$8,000                  │
│  • Bank of America Savings — ~$15,000        │
│  → Bring death certificate to the bank       │
├──────────────────────────────────────────────┤
│  📈 INVESTMENTS                              │
│  • Fidelity 401k (beneficiary may be wrong!) │
│  • Robinhood stocks — ~$6,000                │
│  • Coinbase crypto — ~$2,000                 │
├──────────────────────────────────────────────┤
│  🛡️ INSURANCE TO CLAIM                      │
│  • State Farm Term Life — $500,000           │
│  • Employer group life — check with HR       │
│  • Check for AD&D — could be extra $150K     │
├──────────────────────────────────────────────┤
│  💳 CREDIT CARDS — YOU DO NOT OWE THESE      │
│  • Chase Sapphire — $3,000 (NOT your debt)   │
│  • Discover — $1,200 (NOT your debt)         │
│  → Debt collectors may call. You owe nothing │
│    unless you co-signed.                     │
├──────────────────────────────────────────────┤
│  📉 LOANS                                   │
│  • Student loans $28K — DISCHARGED (you owe  │
│    nothing, contact Navient)                 │
│  • Car loan $14K — secured to vehicle only   │
│  • Mortgage $280K — you can keep the house   │
│    (federal law protects you)                │
├──────────────────────────────────────────────┤
│  🤝 MONEY OWED TO YOU                       │
│  • Brother Mike owes $5,000                  │
│  • Friend Dave owes $2,000                   │
├──────────────────────────────────────────────┤
│  ⬚ CANCEL THESE SUBSCRIPTIONS               │
│  • Netflix, Spotify, Gym                     │
├──────────────────────────────────────────────┤
│  🔊 [Listen to Voice Walkthrough]            │
│  ⛓️ Verified on Solana: tx 4xK9f2mN...      │
└──────────────────────────────────────────────┘
```

**Backend call to load this screen:**
```
GET /api/package/{package_id}?force=true
Response: { "locked": false, "package_data": {...}, "verified": true, "solana_tx": "..." }
```

**Backend call when "Listen to Voice Walkthrough" is clicked:**
```
POST /api/narrate
Body: { "package_id": "pkg_xxx" }
Response: audio/mpeg stream (MP3) — or fallback JSON with script text
```

---

## Additional Small Features to Consider

### 1. Notification Badge on Checklist Items

When the user is on Screen 5 and hasn't filled gaps yet, show a pulsing notification badge:

```
🔴 5 items need attention
```

This creates urgency — the user feels like they SHOULD fill the gaps before sealing.

### 2. Confidence Indicators

Show the user HOW SURE the AI is about each item. Use color coding:

- 🟢 **Certain** — "You clearly stated this" — green border
- 🟡 **Uncertain** — "You said 'I think' or 'maybe'" — yellow border with "Verify?" link
- 🔴 **Vague** — "You barely mentioned this" — red border with "Tell us more" prompt

### 3. Smart Upload Prompts

When the user clicks Upload on a specific item, show a hint:

| Item | Upload Hint |
|---|---|
| 401k details | "Take a photo of your Fidelity statement or benefits portal screenshot" |
| Life insurance | "Upload your benefits enrollment form or pay stub showing insurance deductions" |
| Bank account | "Upload a recent bank statement (we only read account details, not transactions)" |
| Credit card | "Upload your credit card statement or take a photo of the card (we extract issuer & last 4 digits only)" |

### 4. Progress Persistence

If the user closes the app mid-flow and comes back:
- Save the current package_data in localStorage
- Show "Welcome back — you were 68% done. Continue where you left off?"
- This doesn't need any backend change

### 5. Check-in Reminder Screen

After Screen 6 (Sealed), the user should see their check-in schedule:

```
┌──────────────────────────────────────────────┐
│  ⏰ Your Check-in Schedule                   │
│                                              │
│  Next check-in due: March 23, 2026           │
│  Interval: Every 30 days                     │
│                                              │
│  If you don't check in, your package will    │
│  be sent to Sarah at sarah@example.com       │
│                                              │
│  [✅ Check In Now]    [Change Interval]       │
└──────────────────────────────────────────────┘
```

**Backend call:**
```
POST /api/checkin
Body: { "package_id": "pkg_xxx" }
```

---

## Complete API Mapping: Which Screen Calls What

| Screen | Backend Endpoint | When |
|---|---|---|
| Screen 3 (Recording) | `POST /api/analyze` | After voice recording + optional typed text |
| Screen 5 (Checklist) | None — uses data from Screen 3's response | On load |
| Screen 5B (Gap Filler - voice/text) | `POST /api/analyze` | Each time user provides new info |
| Screen 5B (Gap Filler - upload) | `POST /api/extract-doc` | Each time user uploads a document |
| Screen 6 (Seal) | `POST /api/seal` | When user clicks "Seal Package" |
| Screen 6 (Check-in) | `POST /api/checkin` | When user checks in |
| Screen 8 (Family Package) | `GET /api/package/{id}?force=true` | When family opens the link |
| Screen 9 (Voice Player) | `POST /api/narrate` | When family clicks "Listen" |

---

## Data Flow Diagram: The Gap-Filling Loop

```
User Records Voice (Screen 3)
        │
        ▼
POST /api/analyze ──────────► Backend returns { found, missing }
        │
        ▼
Screen 5: Show Checklist
        │
        ├── User clicks "Fill Gaps Now"
        │           │
        │           ▼
        │   Screen 5B: Gap Filler
        │           │
        │           ├── User speaks → ElevenLabs STT → text
        │           │       │
        │           │       ▼
        │           │   POST /api/analyze (new info)
        │           │       │
        │           │       ▼
        │           │   Merge into package_data
        │           │       │
        │           │       ▼
        │           │   Next missing item (loop)
        │           │
        │           ├── User types → text
        │           │       │
        │           │       ▼
        │           │   POST /api/analyze (new info)
        │           │       │
        │           │       ▼
        │           │   Merge into package_data
        │           │
        │           ├── User uploads doc → image
        │           │       │
        │           │       ▼
        │           │   POST /api/extract-doc (image)
        │           │       │
        │           │       ▼
        │           │   Merge extracted data into package
        │           │
        │           └── User clicks "Done" / "Skip"
        │                   │
        │                   ▼
        │           Back to Screen 5 (updated checklist)
        │
        ├── User clicks "Seal Anyway" or "Seal Package"
        │           │
        │           ▼
        │   Screen 6: Review + POST /api/seal
        │
        ▼
    Package Sealed ✅
```

---

## Priority Order for Frontend Teammate

1. **HIGH** — Screen 5B (Gap Filler) — This is the core missing feature
2. **HIGH** — Screen 5 modifications (interactive cards with action buttons)
3. **MEDIUM** — Screen 8 update (show all 6 categories, not just ADP)
4. **MEDIUM** — Screen 6 review step (show completeness before sealing)
5. **LOW** — Screen 3 text input addition
6. **LOW** — Check-in reminder screen
7. **LOW** — Progress persistence (localStorage)
