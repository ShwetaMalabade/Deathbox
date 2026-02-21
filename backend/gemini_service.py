"""
DeathBox — Gemini Service (Person A)
=====================================
Three functions. This is the brain of the entire product.

1. analyze_transcript()   → Messy speech → Structured financial JSON
2. extract_document()     → Document photo → Extracted account details
3. generate_narration_script() → Package data → Warm voice script
"""

import os
import json
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

from mock_data import (
    MOCK_ANALYZE_RESPONSE,
    MOCK_EXTRACT_DOC_RESPONSE,
    MOCK_NARRATION_SCRIPT,
)

load_dotenv()

# ── Setup Gemini ──────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")

# Timeout for Gemini calls (seconds). If exceeded, use mock data.
GEMINI_TIMEOUT = 15


# ══════════════════════════════════════════════════════════
# FUNCTION 1: analyze_transcript
# ══════════════════════════════════════════════════════════

ANALYZE_PROMPT = """You are a financial data extraction engine for DeathBox, a financial afterlife planning tool. Your job is to analyze a transcript of someone describing their financial life and extract ALL financial information into structured JSON.

IMPORTANT — SPEECH-TO-TEXT ERROR HANDLING:
This transcript comes from voice input (speech-to-text). It WILL contain:
- Mispronunciations: "Fidellity" = Fidelity, "Chaise" = Chase, "Capitalone" = Capital One, "Robinhood" = Robinhood, "Antem" = Anthem, "Geeko" = Geico, "Statefarm" = State Farm, "Nayvient" = Navient, "Wellsfargo" = Wells Fargo
- Numbers spoken as words: "fourteen thousand" = 14000, "two grand" = 2000, "five hundred K" = 500000, "about fifty" = ~50
- Casual/slang: "I got some money in" = account, "I owe" = debt, "I lent" = loan given, "puts money in" = investment
- Filler words: "um", "uh", "like", "you know", "I guess" — ignore these but still extract the data
- Run-on sentences and topic jumping — handle gracefully
Always correct these to the proper names/values. NEVER return the misspelled version.

EXTRACTION RULES:
1. Extract EVERY financial item mentioned, organized into these 6 CATEGORIES:

   CATEGORY 1 — BANK ACCOUNTS (type: "bank_account")
   Checking accounts, savings accounts, CDs, money market accounts.
   Extract: bank_name, account_type (checking/savings/cd/money_market), balance, account_number (if mentioned), joint_account (true/false if mentioned).
   Warning: Family needs death certificate to access. Joint accounts transfer automatically.

   CATEGORY 2 — INVESTMENTS (type: "investment")
   401k, IRA, Roth IRA, stocks, bonds, mutual funds, ETFs, crypto, brokerage accounts, RSUs, stock options, ESPP, real estate investments.
   Extract: provider/platform, investment_type, balance/value, account_number, beneficiary.
   Warning: Beneficiary designations on retirement accounts override wills. Vested vs unvested stock matters.

   CATEGORY 3 — INSURANCE POLICIES (type: "insurance")
   Life insurance (group/term/whole), health insurance, car insurance, home/renters insurance, disability insurance, AD&D, dental, vision, umbrella policy.
   Extract: provider, policy_type, coverage_amount, policy_number, premium, beneficiary.
   Warning: Life insurance claims have deadlines. COBRA has 60-day election deadline. AD&D is often bundled and unknown.

   CATEGORY 4 — ACTIVE CREDIT CARDS (type: "credit_card")
   All credit cards with outstanding balances or active accounts.
   Extract: issuer, card_name, balance_owed, credit_limit (if mentioned), rewards_points (if mentioned).
   Warning: Credit card debt generally does NOT transfer to family unless co-signed. Authorized users are NOT responsible. But debt collectors will try to pressure family.

   CATEGORY 5 — LOANS TAKEN (type: "loan_taken")
   Mortgage, car loan, student loans (federal/private), personal loans, home equity, medical debt.
   Extract: lender, loan_type, balance_remaining, monthly_payment (if mentioned), interest_rate (if mentioned), collateral (house/car if secured).
   Warning: Federal student loans discharged on death. Secured debts (car/house) tied to the asset, not the person. Private student loans may NOT be discharged.

   CATEGORY 6 — LOANS GIVEN (type: "loan_given")
   Money lent to friends, family, or anyone else. Informal debts owed TO the deceased.
   Extract: borrower_name, amount, date_given (if mentioned), any_documentation (if mentioned), repayment_status.
   Warning: Informal loans with no documentation are very hard to collect. Family should know these exist but recovery is uncertain.

2. Also extract: subscriptions, employer benefits (PTO, COBRA eligibility, HSA), and any other financial items.
3. For EACH item, include a "confidence" level:
   - "certain" = user stated clearly ("I have a Chase checking with 8 thousand")
   - "uncertain" = user hedged ("I think there's about 15 grand", "maybe 2 thousand")
   - "vague" = barely mentioned or very unclear ("I think they give us some insurance")
4. Add a "warnings" array for each item with specific, actionable advice for the family.
5. Any field not provided → set to "unknown"

MISSING ITEMS DETECTION:
Check if the user mentioned items in ALL 6 categories. For any category that's completely missing or seems incomplete, add to the "missing" array:

- Bank accounts (checking/savings) → urgency: critical (family needs money for immediate expenses)
- Life insurance → urgency: critical (billions go unclaimed because families don't know policies exist)
- Health insurance / COBRA → urgency: critical (60-day deadline)
- 401k / retirement accounts → urgency: critical (beneficiary may be outdated)
- Accrued PTO / vacation days → urgency: high (many states require payout to estate)
- AD&D insurance → urgency: high (90% of workers don't know they have it, bundled with life insurance)
- HSA → urgency: high (transfers tax-free to beneficiary)
- Outstanding credit cards → urgency: medium (family should NOT pay these unless co-signed)
- Mortgage details → urgency: medium (family needs to know if they can keep the house)
- Student loans → urgency: medium (federal loans discharged on death — family needs to know)
- Loans given to others → urgency: low (money owed to the deceased)
- Subscriptions → urgency: low (will keep charging)

Also extract into a "personal_info" object: full name (if mentioned), employer name, years of employment, state, spouse/family names, dependents.

CRITICAL: Return ONLY valid JSON. No markdown. No backticks. No explanation text. Start your response with { and end with }."""


async def analyze_transcript(transcript: str) -> dict:
    """
    Take a raw voice transcript and extract structured financial data.

    Args:
        transcript: The raw text from ElevenLabs Speech-to-Text

    Returns:
        dict with keys: found (list), missing (list), employee_info (dict)
    """
    try:
        full_prompt = ANALYZE_PROMPT + f"\n\nHere is the transcript to analyze:\n\n\"{transcript}\""

        # Run the Gemini call with a timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, full_prompt),
            timeout=GEMINI_TIMEOUT
        )

        # Clean the response — strip markdown backticks if Gemini added them
        text = response.text.strip()
        if text.startswith("```"):
            # Remove ```json and trailing ```
            lines = text.split("\n")
            # Drop first line (```json) and last line (```)
            text = "\n".join(lines[1:-1]).strip()

        result = json.loads(text)

        # Validate the structure has the required keys
        if "found" not in result:
            result["found"] = []
        if "missing" not in result:
            result["missing"] = []
        if "personal_info" not in result and "employee_info" not in result:
            result["personal_info"] = {}
        elif "employee_info" in result and "personal_info" not in result:
            result["personal_info"] = result.pop("employee_info")

        print(f"✅ Gemini analyzed transcript: {len(result['found'])} found, {len(result['missing'])} missing")
        return result

    except asyncio.TimeoutError:
        print("⚠️ Gemini timeout — using mock data")
        return MOCK_ANALYZE_RESPONSE
    except json.JSONDecodeError as e:
        print(f"⚠️ Gemini returned invalid JSON: {e} — using mock data")
        return MOCK_ANALYZE_RESPONSE
    except Exception as e:
        print(f"⚠️ Gemini error: {e} — using mock data")
        return MOCK_ANALYZE_RESPONSE


# ══════════════════════════════════════════════════════════
# FUNCTION 2: extract_document
# ══════════════════════════════════════════════════════════

EXTRACT_DOC_PROMPT = """You are a financial document reader for DeathBox. The user has uploaded a photo of a financial document. This could be ANY financial document: pay stub, benefits statement, insurance card, 401k summary, tax form, bank statement, credit card statement, loan statement, investment account summary, insurance policy declaration, mortgage statement, etc.

Extract EVERY piece of financial information visible. Focus on:

BANK & ACCOUNT DETAILS:
- Bank name, account numbers (even partial like "ending in 8923"), account types, balances
- Routing numbers if visible

INVESTMENT DETAILS:
- Provider/platform names (Fidelity, Vanguard, Schwab, Robinhood, etc.)
- Account numbers, fund names, share counts, balances, contribution amounts
- Employer match percentages, vesting schedules if visible

INSURANCE DETAILS:
- Provider names (MetLife, Anthem, Aetna, State Farm, Geico, etc.)
- Policy numbers, group numbers, coverage amounts, premiums
- Plan types (PPO, HMO, Term Life, Whole Life, AD&D, etc.)
- Beneficiary names if visible

CREDIT CARD DETAILS:
- Issuer, card type, account numbers (even partial), balances, credit limits, minimum payments

LOAN DETAILS:
- Lender name, loan type, account number, balance remaining, interest rate, monthly payment
- Collateral (if mortgage or auto loan)

ALSO EXTRACT:
- Employee ID / employee number
- Employer name and address
- Pay period and pay frequency
- Any reference numbers, claim numbers, or member IDs
- Dollar amounts of ANY kind (balances, deductions, coverage, contributions)

Categorize each extracted item with: "category" as one of (bank_account, investment, insurance, credit_card, loan, employment, other).

Also identify:
- document_type: one of (pay_stub, bank_statement, credit_card_statement, insurance_policy, investment_summary, loan_statement, benefits_statement, tax_form, unknown)
- institution_name: the primary financial institution shown on the document

Return ONLY valid JSON. No markdown. No backticks. No explanation. Start with { and end with }.
Return extracted items in an "extracted" array, each with at minimum: "category", "type", and relevant fields."""


async def extract_document(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Extract financial details from a document image using Gemini Vision.

    Args:
        image_bytes: Raw bytes of the uploaded image
        mime_type: MIME type of the image (image/jpeg, image/png, application/pdf)

    Returns:
        dict with keys: extracted (list), document_type (str), employer_confirmed (str)
    """
    try:
        # Build the multimodal content — text prompt + image
        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }

        response = await asyncio.wait_for(
            asyncio.to_thread(
                model.generate_content,
                [EXTRACT_DOC_PROMPT, image_part]
            ),
            timeout=GEMINI_TIMEOUT
        )

        # Clean response
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]).strip()

        result = json.loads(text)

        if "extracted" not in result:
            result["extracted"] = []

        print(f"✅ Gemini extracted {len(result['extracted'])} items from document")
        return result

    except asyncio.TimeoutError:
        print("⚠️ Gemini Vision timeout — using mock data")
        return MOCK_EXTRACT_DOC_RESPONSE
    except json.JSONDecodeError as e:
        print(f"⚠️ Gemini Vision returned invalid JSON: {e} — using mock data")
        return MOCK_EXTRACT_DOC_RESPONSE
    except Exception as e:
        print(f"⚠️ Gemini Vision error: {e} — using mock data")
        return MOCK_EXTRACT_DOC_RESPONSE


# ══════════════════════════════════════════════════════════
# FUNCTION 3: generate_narration_script
# ══════════════════════════════════════════════════════════

NARRATION_PROMPT = """You are writing a voice narration script for DeathBox. A person has died, and their family member is about to hear an audio walkthrough of the deceased's complete financial picture. This audio will be generated by a text-to-speech engine, so write for the spoken word.

TONE: Warm, empathetic, calm, and clear. This person is grieving. Don't be clinical or robotic. Write like a kind, knowledgeable friend who genuinely cares. Use the recipient's name. Be gentle but direct — they need actionable information, not vague comfort.

STRUCTURE (follow this order):
1. Brief compassionate greeting using the recipient's name.
2. URGENT DEADLINES FIRST — COBRA (60 days), insurance claims, time-sensitive items.
3. BANK ACCOUNTS — what accounts exist, approximate balances, which banks to contact. Mention if any are joint accounts (those transfer automatically).
4. MONEY OWED TO THE FAMILY — life insurance payouts, PTO payout, HSA balance, investment accounts, final paycheck.
5. INVESTMENTS — 401k, stocks, crypto, any investment accounts. Mention beneficiary issues.
6. INSURANCE POLICIES — what's active, what needs to be claimed, what expires.
7. DEBTS & CREDIT CARDS — be very clear about which debts the family is NOT responsible for. Credit card debt does not transfer. Secured debts (car, house) are tied to the asset. Federal student loans are discharged on death. Warn about debt collector tactics.
8. LOANS GIVEN TO OTHERS — money people owe to the deceased. Family should know this exists.
9. SUBSCRIPTIONS — list them, say to cancel.
10. One brief, genuine encouraging sentence to close.

RULES:
- Include specific account numbers, policy numbers, provider names, bank names WHERE AVAILABLE.
- Where information is "unknown", say "you'll need to check with the bank" or "look through their records" — don't skip it.
- Keep it between 400-600 words (about 3-5 minutes when spoken).
- Do NOT use bullet points, dashes, headers, or any formatting — this will be SPOKEN out loud. Write in natural flowing sentences and paragraphs.
- Do NOT start with "Dear" — start with "Hi [name]" for warmth.
- Return ONLY the script text. No JSON. No labels. No quotes around it. Just the raw narration text.

Here is the complete financial package data:
"""


async def generate_narration_script(package_data: dict) -> str:
    """
    Generate a warm, empathetic narration script from the package data.
    Person B calls this function, then sends the text to ElevenLabs TTS.

    Args:
        package_data: The full package dict (found, missing, employee_info)

    Returns:
        Plain text string — the narration script ready for TTS
    """
    try:
        # Convert package data to a readable JSON string for the prompt
        data_str = json.dumps(package_data, indent=2)
        full_prompt = NARRATION_PROMPT + data_str

        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, full_prompt),
            timeout=GEMINI_TIMEOUT
        )

        script = response.text.strip()

        # Remove any markdown formatting Gemini might add
        if script.startswith("```"):
            lines = script.split("\n")
            script = "\n".join(lines[1:-1]).strip()

        # Remove surrounding quotes if present
        if script.startswith('"') and script.endswith('"'):
            script = script[1:-1]

        print(f"✅ Narration script generated: {len(script)} characters")
        return script

    except asyncio.TimeoutError:
        print("⚠️ Gemini timeout for narration — using mock script")
        return MOCK_NARRATION_SCRIPT
    except Exception as e:
        print(f"⚠️ Gemini narration error: {e} — using mock script")
        return MOCK_NARRATION_SCRIPT
