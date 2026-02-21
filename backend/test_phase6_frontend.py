"""
DeathBox — Phase 6 Frontend Integration Test
============================================
Checks frontend-facing readiness:
- CORS + health endpoints
- frontend contract endpoint
- endpoint contract shapes used by frontend
"""

from fastapi.testclient import TestClient

from main import app


def run_phase6_frontend_tests():
    client = TestClient(app)
    passed = 0
    total = 0

    def check(name, ok, details=""):
        nonlocal passed, total
        total += 1
        if ok:
            passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} -- {details}")

    print("\n" + "=" * 60)
    print("PHASE 6 — FRONTEND INTEGRATION TEST")
    print("=" * 60)

    # 1) Health endpoints
    r = client.get("/")
    check("GET /", r.status_code == 200 and "endpoints" in r.json(), f"status={r.status_code}")

    r = client.get("/api/health")
    check("GET /api/health", r.status_code == 200 and r.json().get("status") == "healthy", f"status={r.status_code}")

    # 2) CORS preflight for a frontend call
    preflight_headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
    r = client.options("/api/seal", headers=preflight_headers)
    allow_origin = r.headers.get("access-control-allow-origin")
    allow_methods = r.headers.get("access-control-allow-methods", "")
    cors_ok = r.status_code in (200, 204) and ("POST" in allow_methods or allow_origin is not None)
    check("OPTIONS /api/seal (CORS preflight)", cors_ok, f"status={r.status_code}, allow-origin={allow_origin}")

    # 3) Frontend contract endpoint
    r = client.get("/api/frontend-contract")
    ok = r.status_code == 200 and "contracts" in r.json() and "upload" in r.json()
    check("GET /api/frontend-contract", ok, f"status={r.status_code}")
    contract = r.json() if r.status_code == 200 else {}

    # 4) Contract has required sections
    required_sections = {"analyze", "seal", "package", "checkin", "narrate"}
    contracts = set(contract.get("contracts", {}).keys())
    check(
        "frontend contract sections present",
        required_sections.issubset(contracts),
        f"missing={required_sections - contracts}",
    )

    # 5) Verify /api/seal frontend flow shape
    seal_payload = {
        "package_data": {"found": [], "missing": [], "personal_info": {}},
        "recipient_name": "Sarah",
        "recipient_email": "sarah@example.com",
        "checkin_days": 30,
    }
    r = client.post("/api/seal", json=seal_payload)
    ok = r.status_code == 200 and all(
        key in r.json() for key in ["package_id", "solana_tx", "hash", "next_checkin"]
    )
    check("POST /api/seal response shape", ok, f"status={r.status_code}, body={r.text[:200]}")

    print("\n" + "=" * 60)
    print(f"Phase 6 Frontend Summary: {passed}/{total} passed")
    if passed == total:
        print("✅ Phase 6 frontend integration checks passed.")
    else:
        print("⚠️ Some Phase 6 checks failed.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run_phase6_frontend_tests()

