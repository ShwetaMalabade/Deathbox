"""
DeathBox — Phase 5 Integration Test
===================================
Verifies cross-module integration and end-to-end flow:

health -> analyze -> seal -> package(lock/force) -> checkin -> narrate
"""

from fastapi.testclient import TestClient

from main import app


def run_phase5_integration():
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
    print("PHASE 5 — INTEGRATION TEST")
    print("=" * 60)

    # 1) Health endpoints
    r = client.get("/")
    check("GET /", r.status_code == 200, f"status={r.status_code}")

    r = client.get("/api/health")
    check("GET /api/health", r.status_code == 200, f"status={r.status_code}")

    r = client.get("/api/integration-status")
    ok = r.status_code == 200 and "services" in r.json()
    check("GET /api/integration-status", ok, f"status={r.status_code}, body={r.text[:200]}")

    # 2) Analyze
    transcript = (
        "I work at Acme Corp for 3 years. I have Chase checking with 8000, "
        "Fidelity 401k with 4 percent match, Anthem health insurance, "
        "HSA around 2000, and a Capital One car loan with 14000 left."
    )
    r = client.post("/api/analyze", json={"transcript": transcript})
    ok = r.status_code == 200 and "found" in r.json() and "missing" in r.json()
    check("POST /api/analyze", ok, f"status={r.status_code}, body={r.text[:200]}")
    package_data = r.json() if r.status_code == 200 else {"found": [], "missing": []}

    # 3) Seal
    seal_req = {
        "package_data": package_data,
        "recipient_name": "Sarah",
        "recipient_email": "sarah@example.com",
        "checkin_days": 30,
    }
    r = client.post("/api/seal", json=seal_req)
    ok = r.status_code == 200 and all(k in r.json() for k in ["package_id", "hash", "solana_tx"])
    check("POST /api/seal", ok, f"status={r.status_code}, body={r.text[:200]}")

    package_id = r.json().get("package_id") if r.status_code == 200 else None
    if not package_id:
        print("\n❌ Cannot continue integration flow because /api/seal failed.")
        print(f"\nSummary: {passed}/{total} passed")
        return

    # 4) Package retrieval (locked)
    r = client.get(f"/api/package/{package_id}")
    ok = r.status_code == 200 and r.json().get("locked") is True
    check("GET /api/package/{id} locked", ok, f"status={r.status_code}, body={r.text[:200]}")

    # 5) Package retrieval (force unlock)
    r = client.get(f"/api/package/{package_id}?force=true")
    ok = r.status_code == 200 and r.json().get("locked") is False and "package_data" in r.json()
    check("GET /api/package/{id}?force=true", ok, f"status={r.status_code}, body={r.text[:200]}")

    # 6) Checkin
    r = client.post("/api/checkin", json={"package_id": package_id})
    ok = r.status_code == 200 and "next_checkin" in r.json()
    check("POST /api/checkin", ok, f"status={r.status_code}, body={r.text[:200]}")

    # 7) Narrate (audio OR fallback json)
    r = client.post("/api/narrate", json={"package_id": package_id})
    ctype = r.headers.get("content-type", "")
    if "audio/mpeg" in ctype:
        ok = True
    elif "application/json" in ctype:
        body = r.json()
        ok = body.get("fallback") is True and "script" in body
    else:
        ok = False
    check("POST /api/narrate", ok, f"status={r.status_code}, content-type={ctype}")

    print("\n" + "=" * 60)
    print(f"Phase 5 Integration Summary: {passed}/{total} passed")
    if passed == total:
        print("✅ Phase 5 integration checks passed.")
    else:
        print("⚠️ Some integration checks failed. Review logs above.")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run_phase5_integration()

