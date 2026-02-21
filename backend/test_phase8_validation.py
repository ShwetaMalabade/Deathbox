"""
Phase 8 Test — Mandatory Field Validation
=========================================
Runs in-process using FastAPI TestClient.
No live server required.
"""

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def _incomplete_package():
    return {
        "found": [
            {"type": "401k", "provider": "Fidelity"},  # missing estimated value
            {"type": "loan_taken", "lender": "Capital One"},  # missing loan_type + balance
        ],
        "missing": [],
        "employee_info": {"name": "Test User"},
    }


def _complete_package():
    return {
        "found": [
            {
                "type": "bank_account",
                "institution_name": "Chase",
                "account_type": "checking",
                "estimated_balance": 12000,
            },
            {
                "type": "401k",
                "provider_platform": "Fidelity",
                "investment_type": "401k",
                "estimated_value": 185000,
            },
            {
                "type": "life_insurance",
                "insurer_name": "Prudential",
                "policy_type": "term_life",
                "coverage_amount": 500000,
            },
            {
                "type": "credit_card",
                "issuer_name": "Chase",
                "card_name_or_type": "Sapphire",
                "current_balance": 450,
            },
            {
                "type": "loan_taken",
                "lender_name": "SoFi",
                "loan_type": "student_loan",
                "outstanding_balance": 18000,
            },
            {
                "type": "loan_given",
                "borrower_name": "John Doe",
                "amount_lent": 2500,
            },
        ],
        "missing": [],
        "employee_info": {"name": "Test User"},
    }


def run_tests():
    print("\n=== Phase 8 Validation Tests ===")

    # 1) validate-package should report missing fields
    r = client.post("/api/validate-package", json={"package_data": _incomplete_package()})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ready_to_seal"] is False
    assert len(data["todo_items"]) > 0
    print("PASS: /api/validate-package detects missing fields")

    # 2) seal should be blocked for incomplete package
    seal_payload = {
        "package_data": _incomplete_package(),
        "recipient_name": "Sarah",
        "recipient_email": "sarah@example.com",
        "checkin_days": 30,
    }
    r = client.post("/api/seal", json=seal_payload)
    assert r.status_code == 400, r.text
    body = r.json()
    assert "validation" in body["detail"]
    assert body["detail"]["validation"]["ready_to_seal"] is False
    print("PASS: /api/seal blocks incomplete package")

    # 3) seal should work for complete package
    seal_payload["package_data"] = _complete_package()
    r = client.post("/api/seal", json=seal_payload)
    assert r.status_code == 200, r.text
    sealed = r.json()
    assert "package_id" in sealed and sealed["package_id"].startswith("pkg_")
    print("PASS: /api/seal allows complete package")

    print("=== All Phase 8 tests passed ===\n")


if __name__ == "__main__":
    run_tests()

