"""
DeathBox — Mock Data
====================
Hardcoded fallback responses for the live demo.
If Gemini is slow, rate-limited, or down, we return these instead.
The demo MUST always work.

Covers all 6 categories:
1. Bank Accounts  2. Investments  3. Insurance Policies
4. Credit Cards   5. Loans Taken  6. Loans Given

Demo transcript:
"I work at Acme Corp, been there about 3 years. My wife is Sarah.
I have a checking account with Chase with around 8 thousand and a savings
with Bank of America with maybe 15 grand. I have a 401k through Fidelity,
company matches 4%. I also have a Robinhood account with about 6 thousand
in stocks. For insurance, I have health insurance through Anthem and I think
they give us life insurance but I don't remember how much. I also have car
insurance through Geico and a term life policy with State Farm, 500K coverage.
I have a Chase Sapphire card with about 3 grand balance and a Discover card
with like 1200 on it. For loans, car loan 14K through Capital One, student
loans 28K federal through Navient, and a mortgage 280K with Wells Fargo.
I lent my brother Mike 5 thousand last year and my friend Dave owes me 2
thousand. I pay Netflix, Spotify, and my gym."
"""

MOCK_ANALYZE_RESPONSE = {
    "found": [
        {
            "type": "bank_account",
            "bank_name": "Chase",
            "account_type": "checking",
            "balance": 8000,
            "account_number": "unknown",
            "joint_account": "unknown",
            "confidence": "certain",
            "warnings": [
                "Family will need a death certificate to access this account.",
                "If this is a joint account, the surviving holder gets automatic access. If not, it goes through probate."
            ]
        },
        {
            "type": "bank_account",
            "bank_name": "Bank of America",
            "account_type": "savings",
            "balance": 15000,
            "account_number": "unknown",
            "joint_account": "unknown",
            "confidence": "uncertain",
            "warnings": [
                "User said 'maybe 15 grand' — verify exact balance.",
                "Family needs death certificate + proof of relationship to access."
            ]
        },
        {
            "type": "investment",
            "provider": "Fidelity",
            "investment_type": "401k",
            "employer_match": "4%",
            "balance": "unknown",
            "account_number": "unknown",
            "beneficiary": "unknown",
            "confidence": "uncertain",
            "warnings": [
                "Beneficiary not specified — CRITICAL. Beneficiary designations on 401k accounts override wills.",
                "If beneficiary is outdated (e.g., still lists an ex), the wrong person may receive these funds.",
                "Contact Fidelity with death certificate to check beneficiary and balance."
            ]
        },
        {
            "type": "investment",
            "provider": "Robinhood",
            "investment_type": "brokerage_stocks",
            "balance": 6000,
            "account_number": "unknown",
            "confidence": "certain",
            "warnings": [
                "Stock values fluctuate — the $6,000 value may have changed.",
                "Family will need to contact Robinhood with death certificate to transfer the account.",
                "Do NOT sell positions in panic — consult with an advisor first."
            ]
        },
        {
            "type": "insurance",
            "provider": "Anthem",
            "policy_type": "health_insurance",
            "plan_type": "unknown",
            "cobra_eligible": True,
            "cobra_deadline_days": 60,
            "confidence": "certain",
            "warnings": [
                "Family has exactly 60 DAYS to elect COBRA continuation coverage after death.",
                "Miss this deadline and health insurance is lost forever.",
                "Call Acme Corp HR immediately to begin COBRA election."
            ]
        },
        {
            "type": "insurance",
            "provider": "unknown",
            "policy_type": "group_life_insurance",
            "coverage": "unknown",
            "policy_number": "unknown",
            "beneficiary": "unknown",
            "confidence": "vague",
            "warnings": [
                "User said 'I think they give us some' — coverage amount and provider completely unknown.",
                "Most employers include $50K–$150K group term life insurance.",
                "Family MUST contact Acme Corp HR to find the policy and file a claim.",
                "Billions in life insurance goes unclaimed every year because families don't know it exists."
            ]
        },
        {
            "type": "insurance",
            "provider": "Geico",
            "policy_type": "auto_insurance",
            "policy_number": "unknown",
            "confidence": "certain",
            "warnings": [
                "Cancel or transfer this policy if the vehicle is being kept by the family.",
                "If the vehicle is being sold, cancel after the sale."
            ]
        },
        {
            "type": "insurance",
            "provider": "State Farm",
            "policy_type": "term_life_insurance",
            "coverage": 500000,
            "policy_number": "unknown",
            "beneficiary": "unknown",
            "confidence": "certain",
            "warnings": [
                "This is a $500,000 life insurance payout — call State Farm immediately to file a claim.",
                "You will need the policy number and a death certificate.",
                "Verify who the beneficiary is — this is the single largest asset mentioned."
            ]
        },
        {
            "type": "credit_card",
            "issuer": "Chase",
            "card_name": "Sapphire",
            "balance_owed": 3000,
            "confidence": "certain",
            "warnings": [
                "Credit card debt generally does NOT transfer to family members.",
                "Do NOT pay this unless you are a co-signer (not just an authorized user).",
                "Debt collectors may pressure the family — know your rights. You are not obligated to pay."
            ]
        },
        {
            "type": "credit_card",
            "issuer": "Discover",
            "card_name": "unknown",
            "balance_owed": 1200,
            "confidence": "certain",
            "warnings": [
                "Same rule — credit card debt does not transfer to family.",
                "Notify Discover of the death to freeze the account and stop interest."
            ]
        },
        {
            "type": "loan_taken",
            "lender": "Capital One",
            "loan_type": "auto_loan",
            "balance_remaining": 14000,
            "collateral": "vehicle",
            "confidence": "certain",
            "warnings": [
                "This is a secured debt — tied to the vehicle, not to the family.",
                "Family is NOT personally liable unless they co-signed.",
                "If family wants to keep the car, they may need to continue payments or refinance."
            ]
        },
        {
            "type": "loan_taken",
            "lender": "Navient",
            "loan_type": "federal_student_loan",
            "balance_remaining": 28000,
            "confidence": "certain",
            "warnings": [
                "GOOD NEWS: Federal student loans are DISCHARGED upon death.",
                "Family owes NOTHING on this. Contact Navient with a death certificate.",
                "Do NOT let anyone pressure the family into paying — this debt is legally cancelled."
            ]
        },
        {
            "type": "loan_taken",
            "lender": "Wells Fargo",
            "loan_type": "mortgage",
            "balance_remaining": 280000,
            "collateral": "home",
            "confidence": "certain",
            "warnings": [
                "The mortgage is tied to the property, not the person.",
                "If a co-borrower exists (e.g., spouse), they can continue payments and keep the home.",
                "Federal law (Garn-St. Germain Act) protects surviving spouses from immediate foreclosure.",
                "Contact Wells Fargo with death certificate — do NOT just stop paying."
            ]
        },
        {
            "type": "loan_given",
            "borrower_name": "Mike (brother)",
            "amount": 5000,
            "date_given": "approximately 1 year ago",
            "any_documentation": "unknown",
            "repayment_status": "unknown",
            "confidence": "certain",
            "warnings": [
                "Informal loan with no documentation mentioned — recovery may be difficult.",
                "Family should have a conversation with Mike about this."
            ]
        },
        {
            "type": "loan_given",
            "borrower_name": "Dave (friend)",
            "amount": 2000,
            "any_documentation": "unknown",
            "repayment_status": "unknown",
            "confidence": "certain",
            "warnings": [
                "Informal loan — no documentation mentioned.",
                "Family may want to reach out to Dave, but recovery is uncertain without written agreement."
            ]
        },
        {
            "type": "subscriptions",
            "services": ["Netflix", "Spotify", "Gym membership"],
            "confidence": "certain",
            "warnings": [
                "These will keep charging the deceased's card indefinitely. Cancel all immediately.",
                "Check bank/credit card statements for additional recurring charges not mentioned."
            ]
        }
    ],
    "missing": [
        {
            "type": "investment",
            "name": "Fidelity 401k beneficiary",
            "why_it_matters": "Beneficiary designations on 401k accounts override wills — family needs to verify who is listed."
        },
        {
            "type": "insurance",
            "name": "Group life insurance policy number",
            "why_it_matters": "User mentioned employer life insurance but doesn't know the details — family needs the policy number to file a claim."
        },
        {
            "type": "bank_account",
            "name": "Chase checking account number",
            "why_it_matters": "Family needs the account number to access funds with a death certificate."
        }
    ],
    "personal_info": {
        "employer": "Acme Corp",
        "years_employed": 3,
        "spouse": "Sarah",
        "family_mentioned": ["Mike (brother)", "Dave (friend)"]
    }
}


MOCK_EXTRACT_DOC_RESPONSE = {
    "extracted": [
        {
            "category": "employment",
            "type": "employee_id",
            "value": "A4821",
            "source": "pay stub header"
        },
        {
            "category": "bank_account",
            "type": "direct_deposit",
            "bank_name": "Chase",
            "account_hint": "Acct ending in 4471",
            "deposit_amount": "$3,200/paycheck",
            "source": "direct deposit section"
        },
        {
            "category": "investment",
            "type": "401k_deduction",
            "provider": "Fidelity",
            "account_hint": "Acct ending in 8923",
            "deduction": "$450/paycheck",
            "employer_match": "$180/paycheck (4%)"
        },
        {
            "category": "insurance",
            "type": "life_insurance",
            "provider": "MetLife",
            "group_policy": "GL-49201",
            "coverage": 150000,
            "source": "benefits deduction line"
        },
        {
            "category": "insurance",
            "type": "health_insurance",
            "provider": "Anthem",
            "plan": "PPO Gold",
            "group_number": "ANT-98432",
            "source": "benefits deductions"
        },
        {
            "category": "investment",
            "type": "hsa_contribution",
            "provider": "HealthEquity",
            "contribution": "$100/paycheck",
            "source": "pre-tax deductions"
        },
        {
            "category": "insurance",
            "type": "ad_and_d",
            "provider": "MetLife",
            "coverage": 150000,
            "source": "supplemental deductions"
        }
    ],
    "document_type": "pay_stub",
    "institution_name": "Acme Corp",
    "pay_period": "2026-01-01 to 2026-01-15"
}


MOCK_NARRATION_SCRIPT = """Hi Sarah. I know this is an incredibly hard time, and the last thing you need right now is to worry about money and paperwork. So I've organized everything for you, step by step, starting with the things that are most time-sensitive.

The most urgent thing first. You have exactly 60 days to keep your health insurance through COBRA. Call Acme Corp HR and tell them you need to elect COBRA continuation coverage for dependents. Do not miss this deadline. After 60 days, the option is gone forever.

Now, the biggest financial item. There is a term life insurance policy through State Farm with coverage of $500,000. Call State Farm directly to file a claim. You will need the policy number and a copy of the death certificate. This money is yours. There may also be a group life insurance policy through his employer, but the exact amount and provider are unknown. Contact Acme Corp HR to check.

For bank accounts, there is a checking account at Chase with about $8,000 and a savings account at Bank of America with roughly $15,000. You will need a death certificate and proof that you are the next of kin to access these. If any of these are joint accounts in your name, you can access them immediately.

For investments, his 401k is with Fidelity. The employer was matching 4 percent, but the exact balance is not known. There is an important issue here. The beneficiary on this account may be outdated. Contact Fidelity with the death certificate and verify who is listed. If it is not you, you may need legal help. He also had about $6,000 in stocks on Robinhood. Do not sell anything in a rush. Contact Robinhood to transfer the account.

He also had accrued PTO at Acme Corp. In many states, the company is required to pay unused vacation days to the estate. This could be worth a few thousand dollars. Call HR payroll to request this. Also ask HR about AD&D insurance. Most people don't know they have it, and it could be an additional payout.

Now for debts, and this is important. His federal student loans through Navient, about $28,000, are discharged upon death. You owe nothing. Do not let anyone tell you otherwise. The car loan through Capital One, about $14,000, is tied to the vehicle, not to you. You are not personally liable unless you co-signed. If you want to keep the car, you may need to continue payments. The mortgage with Wells Fargo, $280,000 remaining, is tied to the house. Federal law protects you from immediate foreclosure. Contact Wells Fargo with the death certificate and discuss your options.

For credit cards, there is about $3,000 on a Chase Sapphire and $1,200 on a Discover card. Credit card debt generally does not transfer to family members. Do not pay these unless you were a co-signer. Debt collectors may call and pressure you. Know your rights.

Two more things. His brother Mike owes him $5,000 and his friend Dave owes him $2,000. These are informal loans, so recovery may be tricky, but you should know they exist. And please cancel Netflix, Spotify, and the gym membership. They will keep charging his card if you do not.

You are going to get through this, Sarah. Take it one call at a time. Start with COBRA and the State Farm life insurance claim today. Everything else can wait a few days."""
