"""
DeathBox — ElevenLabs Service (Person B)
=========================================
Three functions:
  text_to_speech()  — Script text → MP3 audio bytes
  clone_voice()     — Audio file bytes → new voice_id (Instant Voice Clone)
"""

import os
import httpx
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "Rachel")

BASE_URL = "https://api.elevenlabs.io/v1"


async def text_to_speech(script: str, voice_id: Optional[str] = None) -> bytes:
    """
    Convert narration script text to spoken audio using ElevenLabs TTS.

    Args:
        script: The narration text to speak (from Gemini)
        voice_id: Optional custom voice ID (e.g. a cloned voice).
                  Falls back to the default ELEVENLABS_VOICE_ID from .env.

    Returns:
        Raw MP3 audio bytes ready to stream to the frontend

    Raises:
        Exception if ElevenLabs API fails
    """
    vid = voice_id or ELEVENLABS_VOICE_ID
    url = f"{BASE_URL}/text-to-speech/{vid}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    body = {
        "text": script,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.8,
            "style": 0.4,
            "use_speaker_boost": True
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, headers=headers, json=body)

        if response.status_code != 200:
            error_detail = response.text
            print(f"❌ ElevenLabs TTS error {response.status_code}: {error_detail}")
            raise Exception(f"ElevenLabs TTS failed: {response.status_code} — {error_detail}")

        audio_bytes = response.content
        print(f"✅ ElevenLabs generated audio: {len(audio_bytes)} bytes (voice={vid})")
        return audio_bytes


async def clone_voice(audio_bytes: bytes, filename: str = "voice_sample.webm") -> str:
    """
    Create an Instant Voice Clone on ElevenLabs from a recording.

    Args:
        audio_bytes: Raw audio bytes from the user's recording
        filename: Original filename (used for MIME type hint)

    Returns:
        The new voice_id string from ElevenLabs

    Raises:
        Exception if the clone API call fails
    """
    url = f"{BASE_URL}/voices/add"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            headers=headers,
            data={
                "name": "DeathBox User Voice",
                "description": "Voice clone from DeathBox recording session",
            },
            files={
                "files": (filename, audio_bytes, "audio/webm"),
            },
        )

        if response.status_code != 200:
            error_detail = response.text
            print(f"❌ ElevenLabs clone error {response.status_code}: {error_detail}")
            raise Exception(f"ElevenLabs voice clone failed: {response.status_code} — {error_detail}")

        data = response.json()
        voice_id = data["voice_id"]
        print(f"✅ Voice cloned successfully: {voice_id}")
        return voice_id
