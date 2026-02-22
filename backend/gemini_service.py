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
MODEL_CHAIN = [
    ("gemini-2.5-flash", genai.GenerativeModel("gemini-2.5-flash")),
    ("gemini-2.0-flash", genai.GenerativeModel("gemini-2.0-flash")),
    ("gemini-1.5-flash", genai.GenerativeModel("gemini-1.5-flash")),
]
PRIMARY_MODEL = MODEL_CHAIN[0][1]
GEMINI_TIMEOUT = 45


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

2. Also extract subscriptions and any other financial items the user mentions.
3. For EACH item, include a "confidence" level:
   - "certain" = user stated clearly ("I have a Chase checking with 8 thousand")
   - "uncertain" = user hedged ("I think there's about 15 grand", "maybe 2 thousand")
   - "vague" = barely mentioned or very unclear ("I think they give us some insurance")
4. Add a "warnings" array for each item with specific, actionable advice for the family.
5. Any field not provided → set to "unknown"

MISSING ITEMS DETECTION:
ONLY flag missing DETAILS for items the user actually talked about. Do NOT add entire unmentioned categories.

Per-type missing details to check:
- Bank account → account number, balance, account type (checking/savings), online banking login
- Subscription/membership (gym, streaming, etc.) → provider login email, username, password, monthly cost
- 401k/retirement → account number, beneficiary name, provider, approximate balance
- Insurance (life, health, auto) → policy number, provider, beneficiary, premium amount
- Credit card → card issuer, outstanding balance, authorized users
- Mortgage/loan → lender, remaining balance, monthly payment, co-signer
- Investment/brokerage → account number, provider, beneficiary, approximate value

Rules:
- For EACH item the user mentioned, check if the key details above are missing. Add ONE missing item per gap.
- Do NOT add "Life insurance", "HSA", "Student loans", etc. as missing just because the user didn't mention them. Only flag gaps in what they already told you.
- Each missing item must have: "type" (the category, e.g. "subscription"), "name" (short label like "Planet Fitness login credentials"), "why_it_matters" (one sentence why the family needs this).
- Typically 1-4 missing items. Only truly important gaps for the items the user described.

Also extract into a "personal_info" object: full name (if mentioned), employer name, years of employment, state, spouse/family names, dependents.

OUTPUT FORMAT — you MUST return this exact structure:
{
  "found": [
    {"type": "bank_account", "bank_name": "Chase", "account_type": "checking", "balance": 8000, "confidence": "certain", "warnings": ["..."]},
    {"type": "insurance", "provider": "Anthem", "policy_type": "health", "confidence": "certain", "warnings": ["..."]}
  ],
  "missing": [
    {"type": "bank_account", "name": "Chase checking account number", "why_it_matters": "Family needs this to access funds."}
  ],
  "personal_info": {"full_name": "John", "spouse": "Sarah", "employer": "Acme Corp"}
}

"found" MUST be a FLAT array of objects — do NOT nest items under category keys.
"missing" MUST be a FLAT array of objects — only gaps in items the user mentioned.

CRITICAL: Return ONLY valid JSON. No markdown. No backticks. No explanation text. Start your response with { and end with }."""


async def analyze_transcript(transcript: str) -> dict:
    """
    Take a raw voice transcript and extract structured financial data.

    Args:
        transcript: The raw text from ElevenLabs Speech-to-Text

    Returns:
        dict with keys: found (list), missing (list), employee_info (dict)
    """
    full_prompt = ANALYZE_PROMPT + f"\n\nHere is the transcript to analyze:\n\n\"{transcript}\""

    last_error = ""
    for model_name, current_model in MODEL_CHAIN:
        try:
            print(f"🔄 Trying {model_name}...")
            response = await asyncio.wait_for(
                asyncio.to_thread(current_model.generate_content, full_prompt),
                timeout=GEMINI_TIMEOUT
            )

            text = response.text.strip()
            print(f"🔍 {model_name} raw response (first 300 chars): {text[:300]}")
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:-1]).strip()

            result = json.loads(text)
            result = _normalize_analysis(result)

            print(f"✅ {model_name} analyzed transcript: {len(result['found'])} found, {len(result['missing'])} missing")
            return result

        except Exception as e:
            last_error = str(e)
            is_rate_limit = "429" in last_error or "quota" in last_error.lower() or "resource_exhausted" in last_error.lower()
            label = "rate limited" if is_rate_limit else "failed"
            print(f"⚠️ {model_name} {label}: {last_error[:120]}")
            continue

    print(f"⚠️ All models failed — FALLING BACK TO MOCK DATA")
    return MOCK_ANALYZE_RESPONSE


def _normalize_analysis(result: dict) -> dict:
    """Normalize the Gemini response into a consistent {found, missing, personal_info} structure."""
    if "found" not in result:
        for alt_key in ("financial_items", "extracted_data", "items", "accounts", "data"):
            if alt_key in result:
                result["found"] = result.pop(alt_key)
                break
        else:
            result["found"] = []

    if isinstance(result["found"], dict):
        flat = []
        for category_key, items in result["found"].items():
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and "type" not in item:
                        item["type"] = category_key.rstrip("s")
                    flat.append(item)
            elif isinstance(items, dict):
                if "type" not in items:
                    items["type"] = category_key
                flat.append(items)
        result["found"] = flat

    if "missing" not in result:
        for alt_key in ("missing_items", "missing_details", "gaps"):
            if alt_key in result:
                result["missing"] = result.pop(alt_key)
                break
        else:
            result["missing"] = []

    if isinstance(result["missing"], dict):
        flat_missing = []
        for key, val in result["missing"].items():
            if isinstance(val, list):
                flat_missing.extend(val)
            elif isinstance(val, dict):
                flat_missing.append(val)
        result["missing"] = flat_missing

    if "personal_info" not in result:
        if "employee_info" in result:
            result["personal_info"] = result.pop("employee_info")
        else:
            result["personal_info"] = {}

    pi = result["personal_info"]
    if "spouse" not in pi or pi.get("spouse") is None:
        for key in ("spouse_family_names", "spouse_name", "spouse_names", "partner", "family_names"):
            if key in pi and pi[key]:
                val = pi.pop(key)
                pi["spouse"] = val[0] if isinstance(val, list) else val
                break
    if "employer" not in pi or pi.get("employer") is None:
        for key in ("employer_name", "company", "company_name"):
            if key in pi and pi[key]:
                pi["employer"] = pi.pop(key)
                break

    return result


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
                PRIMARY_MODEL.generate_content,
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

STRUCTURE (follow this order, but ONLY include sections where the user actually provided data):
1. Brief compassionate greeting using the recipient's name.
2. Then go through ONLY the items in the "found" array — bank accounts, subscriptions, insurance, investments, loans, credit cards, etc. Talk about each one naturally.
3. One brief, genuine encouraging sentence to close.

CRITICAL RULES:
- ONLY mention items that appear in the "found" array. If the user only mentioned a bank account and a gym membership, ONLY talk about those two things.
- Do NOT mention categories the user never talked about (insurance, 401k, student loans, etc.) unless they are in "found".
- Do NOT say "you'll need to check with the bank" or "look through their records" for unknown fields. If a detail is "unknown", simply skip it.
- Do NOT invent or assume any information that isn't in the data.
- Include specific details (account numbers, balances, provider names) only WHERE the user actually provided them.
- Keep it SHORT — scale the length to the amount of data. If only 2 items were found, the script should be 100-150 words. If 10 items, it can be 300-400 words.
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
            asyncio.to_thread(PRIMARY_MODEL.generate_content, full_prompt),
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
