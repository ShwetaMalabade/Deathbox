"""
DeathBox — Phase 1-4 Regression Tests
=====================================
In-process tests using FastAPI TestClient (no live server needed).
Compatible with mandatory validation before sealing.
"""

from fastapi.testclient import TestClient

from main import app


def complete_package_data():
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
                "issuer_name": "Amex",
                "card_name_or_type": "Gold",
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


def run_phase1_4_tests():
    client = TestClient(app)
    passed = 0
    total = 0

    def check(name, ok, details=""):
        nonlocal passed, total
        total += 1
        if ok:
            passed += 1
            print(f"PASS: {name}")
        else:
            print(f"FAIL: {name} -- {details}")

    print("\n=== Phase 1-4 Regression Tests ===")

    # Phase 1: app boot + health
    r = client.get("/")
    check("Phase 1 - GET /", r.status_code == 200, f"status={r.status_code}")

    r = client.get("/api/health")
    check("Phase 1 - GET /api/health", r.status_code == 200, f"status={r.status_code}")

    # Phase 2: analyze + validate + seal
    transcript = (
        "I have a Chase checking account, Fidelity 401k, Prudential life insurance, "
        "an Amex card, a student loan from SoFi, and I loaned money to John."
    )
    r = client.post("/api/analyze", json={"transcript": transcript})
    check("Phase 2 - POST /api/analyze", r.status_code == 200, f"status={r.status_code}")

    complete_pkg = complete_package_data()
    r = client.post("/api/validate-package", json={"package_data": complete_pkg})
    ok = r.status_code == 200 and r.json().get("ready_to_seal") is True
    check("Phase 2 - POST /api/validate-package", ok, f"status={r.status_code}, body={r.text[:150]}")

    r = client.post(
        "/api/seal",
        json={
            "package_data": complete_pkg,
            "recipient_name": "Sarah",
            "recipient_email": "sarah@example.com",
            "checkin_days": 30,
        },
    )
    ok = r.status_code == 200 and "package_id" in r.json()
    check("Phase 2 - POST /api/seal", ok, f"status={r.status_code}, body={r.text[:150]}")
    package_id = r.json().get("package_id") if r.status_code == 200 else None

    if not package_id:
        print(f"\nSummary: {passed}/{total} passed")
        return

    # Phase 3: package retrieval + checkin
    r = client.get(f"/api/package/{package_id}")
    ok = r.status_code == 200 and r.json().get("locked") is True
    check("Phase 3 - GET /api/package/{id}", ok, f"status={r.status_code}, body={r.text[:150]}")

    r = client.get(f"/api/package/{package_id}?force=true")
    ok = r.status_code == 200 and r.json().get("locked") is False
    check("Phase 3 - GET /api/package/{id}?force=true", ok, f"status={r.status_code}, body={r.text[:150]}")

    r = client.post("/api/checkin", json={"package_id": package_id})
    ok = r.status_code == 200 and "next_checkin" in r.json()
    check("Phase 3 - POST /api/checkin", ok, f"status={r.status_code}, body={r.text[:150]}")

    # Phase 4: narrate (audio or fallback JSON)
    r = client.post("/api/narrate", json={"package_id": package_id})
    ctype = r.headers.get("content-type", "")
    if "audio/mpeg" in ctype:
        ok = True
    elif "application/json" in ctype:
        body = r.json()
        ok = body.get("fallback") is True and "script" in body
    else:
        ok = False
    check("Phase 4 - POST /api/narrate", ok, f"status={r.status_code}, content-type={ctype}")

    print(f"\nSummary: {passed}/{total} passed")
    if passed == total:
        print("ALL PASS: Phase 1-4 flow is working.")
    else:
        print("Some checks failed. See details above.")


if __name__ == "__main__":
    run_phase1_4_tests()

