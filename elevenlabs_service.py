"""
DeathBox — ElevenLabs Service (Person B)
=========================================
One function: text_to_speech()
Takes a script string, sends to ElevenLabs TTS, returns MP3 bytes.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "Rachel")

# ElevenLabs TTS endpoint
TTS_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"


async def text_to_speech(script: str) -> bytes:
    """
    Convert narration script text to spoken audio using ElevenLabs TTS.

    Args:
        script: The narration text to speak (from Gemini)

    Returns:
        Raw MP3 audio bytes ready to stream to the frontend

    Raises:
        Exception if ElevenLabs API fails
    """
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    body = {
        "text": script,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.6,       # Slightly more expressive
            "similarity_boost": 0.8, # Keep it natural
            "style": 0.4,           # Some emotional expression
            "use_speaker_boost": True
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(TTS_URL, headers=headers, json=body)

        if response.status_code != 200:
            error_detail = response.text
            print(f"❌ ElevenLabs error {response.status_code}: {error_detail}")
            raise Exception(f"ElevenLabs TTS failed: {response.status_code} — {error_detail}")

        audio_bytes = response.content
        print(f"✅ ElevenLabs generated audio: {len(audio_bytes)} bytes")
        return audio_bytes
