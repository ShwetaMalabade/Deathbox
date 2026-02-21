"""
Phase 7 deployment-readiness checks.
This verifies deployment artifacts exist and smoke-tests a running base URL.
"""

import os
import sys
from pathlib import Path

import httpx

BASE_DIR = Path(__file__).resolve().parent


def check_file(path: Path) -> bool:
    return path.exists() and path.is_file()


def run_local_artifact_checks() -> int:
    required_files = [
        BASE_DIR / ".env.production.example",
        BASE_DIR / "deploy" / "systemd" / "deathbox.service",
        BASE_DIR / "deploy" / "nginx" / "deathbox.conf",
        BASE_DIR / "documents" / "PHASE_7_DEPLOYMENT.md",
    ]

    print("\\n=== Phase 7 Artifact Checks ===")
    ok_all = True
    for f in required_files:
        ok = check_file(f)
        print(f"{'PASS' if ok else 'FAIL'} - {f}")
        ok_all = ok_all and ok

    return 0 if ok_all else 1


def run_smoke(base_url: str) -> int:
    print("\\n=== Phase 7 Deployment Smoke Test ===")
    endpoints = [
        ("GET /", "GET", f"{base_url}/"),
        ("GET /api/health", "GET", f"{base_url}/api/health"),
        ("GET /api/integration-status", "GET", f"{base_url}/api/integration-status"),
        ("GET /api/frontend-contract", "GET", f"{base_url}/api/frontend-contract"),
    ]

    with httpx.Client(timeout=15.0) as client:
        ok_all = True
        for name, method, url in endpoints:
            try:
                r = client.request(method, url)
                ok = r.status_code == 200
                print(f"{'PASS' if ok else 'FAIL'} - {name} -> {r.status_code}")
                ok_all = ok_all and ok
            except Exception as exc:
                print(f"FAIL - {name} -> error: {exc}")
                ok_all = False

    return 0 if ok_all else 1


def main() -> int:
    artifact_rc = run_local_artifact_checks()

    base_url = os.getenv("DEPLOY_BASE_URL", "").strip()
    if not base_url:
        print("\\nDEPLOY_BASE_URL not set; skipping remote smoke test.")
        print("Set it like: DEPLOY_BASE_URL=http://<server-ip> python test_phase7_deployment.py")
        return artifact_rc

    smoke_rc = run_smoke(base_url.rstrip('/'))
    return 0 if (artifact_rc == 0 and smoke_rc == 0) else 1


if __name__ == "__main__":
    raise SystemExit(main())
