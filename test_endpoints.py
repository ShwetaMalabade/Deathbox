"""
DeathBox — Test Script
========================
Run the server first:   python main.py
Then run this:          python test_endpoints.py

Tests each endpoint one by one so you can verify everything works.
Comment/uncomment tests as needed.
"""

import httpx
import asyncio
import json

BASE_URL = "http://localhost:8000"


# ── Colors for terminal output ──
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def header(text):
    print(f"\n{'='*60}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{'='*60}")


def success(text):
    print(f"{GREEN}✅ {text}{RESET}")


def fail(text):
    print(f"{RED}❌ {text}{RESET}")


def info(text):
    print(f"{YELLOW}   {text}{RESET}")


# ══════════════════════════════════════════════════════════
# TEST 1: Health Check
# ══════════════════════════════════════════════════════════
async def test_health():
    header("TEST 1: Health Check — GET /")
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}/")
        if r.status_code == 200:
            success(f"Server is running! Status: {r.json()['status']}")
        else:
            fail(f"Server returned {r.status_code}")


# ══════════════════════════════════════════════════════════
# TEST 2: Analyze Transcript
# ══════════════════════════════════════════════════════════
async def test_analyze():
    header("TEST 2: Analyze Transcript — POST /api/analyze")

    transcript = (
        "I work at Acme Corp, been there about 3 years. "
        "I have a 401k through Fidelity, my company matches 4 percent. "
        "I also have health insurance through Anthem, it's a PPO plan. "
        "I have an HSA with maybe 2 grand in it. "
        "I think they give us life insurance but honestly I don't remember how much. "
        "Oh and I have a car loan, about 14K left through Capital One. "
        "I pay for Netflix and Spotify too. My wife is Sarah."
    )

    info(f"Sending transcript ({len(transcript)} chars)...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{BASE_URL}/api/analyze",
            json={"transcript": transcript}
        )

        if r.status_code == 200:
            data = r.json()
            found_count = len(data.get("found", []))
            missing_count = len(data.get("missing", []))
            success(f"Analysis complete! Found: {found_count} items, Missing: {missing_count} items")

            print(f"\n{BOLD}Found items:{RESET}")
            for item in data.get("found", []):
                item_type = item.get("type", "unknown")
                confidence = item.get("confidence", "?")
                warnings = item.get("warnings", [])
                print(f"   • {item_type} (confidence: {confidence})")
                for w in warnings[:2]:  # Show first 2 warnings
                    info(f"  ⚠️  {w[:80]}...")

            print(f"\n{BOLD}Missing items:{RESET}")
            for item in data.get("missing", []):
                item_type = item.get("type", "unknown")
                urgency = item.get("urgency", "?")
                print(f"   • {item_type} (urgency: {urgency})")

            if data.get("employee_info"):
                print(f"\n{BOLD}Employee info:{RESET}")
                for k, v in data["employee_info"].items():
                    print(f"   {k}: {v}")

            return data
        else:
            fail(f"Error {r.status_code}: {r.text}")
            return None


# ══════════════════════════════════════════════════════════
# TEST 3: Seal Package
# ══════════════════════════════════════════════════════════
async def test_seal(package_data=None):
    header("TEST 3: Seal Package — POST /api/seal")

    if package_data is None:
        # Use a simple test package if none provided
        package_data = {
            "found": [
                {"type": "401k", "provider": "Fidelity", "confidence": "uncertain"},
                {"type": "health_insurance", "provider": "Anthem", "cobra_eligible": True},
                {"type": "hsa", "balance": 2000},
                {"type": "auto_loan", "lender": "Capital One", "balance": 14000}
            ],
            "missing": [
                {"type": "life_insurance", "urgency": "critical"},
                {"type": "pto_accrued", "urgency": "critical"}
            ],
            "employee_info": {"employer": "Acme Corp", "spouse": "Sarah"}
        }

    seal_request = {
        "package_data": package_data,
        "recipient_name": "Sarah",
        "recipient_email": "sarah@example.com",
        "checkin_days": 30
    }

    info("Sealing package...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{BASE_URL}/api/seal", json=seal_request)

        if r.status_code == 200:
            data = r.json()
            success(f"Package sealed!")
            print(f"   Package ID:  {data['package_id']}")
            print(f"   Solana TX:   {data['solana_tx'][:40]}...")
            print(f"   Hash:        {data['hash'][:40]}...")
            print(f"   Next check-in: {data['next_checkin']}")
            return data["package_id"]
        else:
            fail(f"Error {r.status_code}: {r.text}")
            return None


# ══════════════════════════════════════════════════════════
# TEST 4: Get Package (Family View)
# ══════════════════════════════════════════════════════════
async def test_get_package(package_id):
    header("TEST 4: Get Package — GET /api/package/{id}")

    async with httpx.AsyncClient(timeout=10.0) as client:
        # First try WITHOUT force — should be locked
        info("Trying without force (should be locked)...")
        r = await client.get(f"{BASE_URL}/api/package/{package_id}")
        if r.status_code == 200:
            data = r.json()
            if data.get("locked"):
                success(f"Package is locked as expected. Unlocks at: {data.get('unlocks_at', '?')}")
            else:
                info("Package is already unlocked (unexpected)")

        # Now try WITH force — should return data
        info("Trying with ?force=true (demo mode)...")
        r = await client.get(f"{BASE_URL}/api/package/{package_id}?force=true")
        if r.status_code == 200:
            data = r.json()
            if not data.get("locked"):
                success("Package unlocked! Family can see the data.")
                found_count = len(data.get("package_data", {}).get("found", []))
                print(f"   Items in package: {found_count}")
                print(f"   Recipient: {data.get('recipient_name')}")
                print(f"   Solana TX: {data.get('solana_tx', 'N/A')[:40]}...")
                print(f"   Verified: {data.get('verified')}")
            else:
                fail("Package still locked even with force=true")
        else:
            fail(f"Error {r.status_code}: {r.text}")


# ══════════════════════════════════════════════════════════
# TEST 5: Check-in (Reset Timer)
# ══════════════════════════════════════════════════════════
async def test_checkin(package_id):
    header("TEST 5: Check-in — POST /api/checkin")

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(
            f"{BASE_URL}/api/checkin",
            json={"package_id": package_id}
        )
        if r.status_code == 200:
            data = r.json()
            success(f"Check-in successful! Next check-in: {data['next_checkin']}")
        else:
            fail(f"Error {r.status_code}: {r.text}")


# ══════════════════════════════════════════════════════════
# TEST 6: Narrate (Voice Walkthrough)
# ══════════════════════════════════════════════════════════
async def test_narrate(package_id):
    header("TEST 6: Narrate — POST /api/narrate")
    info("This calls Gemini for script + ElevenLabs for audio. May take 10-20 seconds...")

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{BASE_URL}/api/narrate",
            json={"package_id": package_id}
        )

        if r.status_code == 200:
            content_type = r.headers.get("content-type", "")

            if "audio" in content_type:
                # Got audio back — save it to test
                audio_file = f"test_narration_{package_id}.mp3"
                with open(audio_file, "wb") as f:
                    f.write(r.content)
                success(f"Audio generated! Saved to {audio_file} ({len(r.content)} bytes)")
                info("Play the MP3 file to hear the narration!")
            else:
                # Got fallback (script text) — ElevenLabs probably failed
                data = r.json()
                if data.get("fallback"):
                    info("ElevenLabs unavailable — got script text instead:")
                    print(f"\n{data.get('script', '')[:300]}...")
                    success("Narration script generated (no audio — check ElevenLabs API key)")
                else:
                    success("Response received")
                    print(json.dumps(data, indent=2)[:500])
        else:
            fail(f"Error {r.status_code}: {r.text}")


# ══════════════════════════════════════════════════════════
# RUN ALL TESTS
# ══════════════════════════════════════════════════════════
async def run_all():
    print(f"\n{BOLD}🔥 DeathBox Backend Test Suite{RESET}")
    print(f"   Server: {BASE_URL}\n")

    # Test 1: Server alive?
    await test_health()

    # Test 2: Analyze transcript (Gemini)
    analyze_result = await test_analyze()

    # Test 3: Seal the package
    package_id = await test_seal(analyze_result)

    if package_id:
        # Test 4: Retrieve the package (family view)
        await test_get_package(package_id)

        # Test 5: Check-in
        await test_checkin(package_id)

        # Test 6: Narrate (Gemini + ElevenLabs)
        # ⚠️ This one costs ElevenLabs credits — uncomment when ready
        # await test_narrate(package_id)
        info("\n💡 Test 6 (narrate) is commented out to save ElevenLabs credits.")
        info("   Uncomment the line in run_all() when you're ready to test audio.\n")

    print(f"\n{'='*60}")
    print(f"{BOLD}{GREEN}All tests complete!{RESET}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(run_all())
