"""
DeathBox — Package Validation Service
=====================================
Rule-based mandatory-field validation for completion checks.
Gemini extracts data; this module decides complete/incomplete deterministically.
"""

from typing import Dict, List, Tuple


SECTION_CONFIG = {
    "total_bank_balance": {
        "label": "Total Bank Balance",
        "required": {
            "institution_name": ["institution_name", "bank_name", "provider"],
            "account_type": ["account_type"],
            "estimated_balance": ["estimated_balance", "balance", "current_balance"],
        },
    },
    "investments": {
        "label": "Investments",
        "required": {
            "provider_platform": ["provider_platform", "provider", "platform"],
            "investment_type": ["investment_type", "plan_type"],
            "estimated_value": ["estimated_value", "value", "balance", "current_value"],
        },
    },
    "insurance_policies": {
        "label": "Insurance Policies",
        "required": {
            "insurer_name": ["insurer_name", "provider", "carrier"],
            "policy_type": ["policy_type", "plan_type"],
            "coverage_amount": ["coverage_amount", "coverage", "sum_assured"],
        },
    },
    "active_credit_cards": {
        "label": "Active Credit Cards",
        "required": {
            "issuer_name": ["issuer_name", "issuer", "provider", "lender"],
            "card_name_or_type": ["card_name_or_type", "card_name", "card_type", "network"],
            "current_balance": ["current_balance", "balance", "balance_owed"],
        },
    },
    "loan_taken": {
        "label": "Loan Taken",
        "required": {
            "lender_name": ["lender_name", "lender", "provider"],
            "loan_type": ["loan_type"],
            "outstanding_balance": ["outstanding_balance", "balance", "balance_remaining"],
        },
    },
    "loan_given": {
        "label": "Loan Given",
        "required": {
            "borrower_name": ["borrower_name", "borrower"],
            "amount_lent": ["amount_lent", "amount", "balance"],
        },
    },
}


TYPE_TO_SECTION = {
    # Bank
    "bank_account": "total_bank_balance",
    "checking": "total_bank_balance",
    "savings": "total_bank_balance",
    "money_market": "total_bank_balance",
    "cd": "total_bank_balance",
    # Investments
    "investment": "investments",
    "401k": "investments",
    "ira": "investments",
    "roth_ira": "investments",
    "brokerage": "investments",
    "stocks": "investments",
    "stock": "investments",
    "crypto": "investments",
    "pension": "investments",
    "rsu": "investments",
    "espp": "investments",
    # Insurance
    "insurance": "insurance_policies",
    "life_insurance": "insurance_policies",
    "health_insurance": "insurance_policies",
    "add_insurance": "insurance_policies",
    "ad_and_d_insurance": "insurance_policies",
    "disability_insurance": "insurance_policies",
    "auto_insurance": "insurance_policies",
    "home_insurance": "insurance_policies",
    "renters_insurance": "insurance_policies",
    # Credit cards
    "credit_card": "active_credit_cards",
    "credit_cards": "active_credit_cards",
    "card": "active_credit_cards",
    # Loans taken
    "loan_taken": "loan_taken",
    "auto_loan": "loan_taken",
    "mortgage": "loan_taken",
    "student_loan": "loan_taken",
    "personal_loan": "loan_taken",
    # Loan given
    "loan_given": "loan_given",
}


def _is_missing(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        v = value.strip().lower()
        return v in {"", "unknown", "n/a", "na", "none", "not sure", "unsure"}
    return False


def _first_present(item: dict, candidates: List[str]):
    for key in candidates:
        if key in item and not _is_missing(item.get(key)):
            return item.get(key)
    return None


def _detect_section(item: dict) -> str:
    item_type = str(item.get("type", "")).strip().lower()
    if item_type in TYPE_TO_SECTION:
        return TYPE_TO_SECTION[item_type]

    # Heuristic fallback for ambiguous records
    if "borrower_name" in item or "borrower" in item:
        return "loan_given"
    if "issuer" in item or "card_name" in item or "balance_owed" in item:
        return "active_credit_cards"
    if "policy_type" in item or "coverage" in item:
        return "insurance_policies"
    if "account_type" in item and ("bank_name" in item or "institution_name" in item):
        return "total_bank_balance"
    if "loan_type" in item or "lender" in item:
        return "loan_taken"
    return "investments"


def validate_package_completeness(package_data: dict) -> dict:
    """
    Validate mandatory fields for the 6 required sections.
    Returns a frontend-friendly structure with TODO items.
    """
    found_items = package_data.get("found", []) if isinstance(package_data, dict) else []

    section_items: Dict[str, List[Tuple[int, dict]]] = {k: [] for k in SECTION_CONFIG.keys()}
    for idx, item in enumerate(found_items):
        if not isinstance(item, dict):
            continue
        section = _detect_section(item)
        section_items[section].append((idx, item))

    sections = {}
    todo_items = []

    for section_key, cfg in SECTION_CONFIG.items():
        items = section_items.get(section_key, [])
        section_missing = []
        section_todos = []

        if len(items) == 0:
            section_missing.append("at_least_one_record")
            section_todos.append(
                f"Add at least one record for {cfg['label']}."
            )
        else:
            for idx, item in items:
                missing_fields = []
                for required_field, aliases in cfg["required"].items():
                    val = _first_present(item, aliases)
                    if _is_missing(val):
                        missing_fields.append(required_field)

                if missing_fields:
                    section_missing.extend(
                        [f"item_{idx}.{field}" for field in missing_fields]
                    )
                    section_todos.append(
                        f"Complete {cfg['label']} item #{idx + 1}: missing {', '.join(missing_fields)}."
                    )

        complete = len(section_missing) == 0
        sections[section_key] = {
            "label": cfg["label"],
            "complete": complete,
            "item_count": len(items),
            "missing_fields": section_missing,
            "todo_items": section_todos,
        }
        todo_items.extend(section_todos)

    all_complete = all(sec["complete"] for sec in sections.values())

    return {
        "all_sections_complete": all_complete,
        "ready_to_seal": all_complete,
        "sections": sections,
        "todo_items": todo_items,
        "summary": {
            "complete_sections": sum(1 for s in sections.values() if s["complete"]),
            "total_sections": len(sections),
        },
    }

