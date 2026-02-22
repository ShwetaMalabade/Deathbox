const API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ?? ""

/**
 * Send an audio blob to ElevenLabs Speech-to-Text and get back a transcript.
 */
export async function speechToText(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append("file", audioBlob, "recording.webm")
  formData.append("model_id", "scribe_v1")

  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": API_KEY },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ElevenLabs STT failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.text as string
}

/**
 * Create an Instant Voice Clone on ElevenLabs from the user's audio recording.
 * Returns the new voice_id that can be used for TTS later.
 */
export async function cloneVoice(
  audioBlob: Blob,
  name: string = "DeathBox User"
): Promise<string> {
  const formData = new FormData()
  formData.append("name", name)
  formData.append("files", audioBlob, "voice_sample.webm")
  formData.append(
    "description",
    "Voice clone created from DeathBox recording session"
  )

  const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: { "xi-api-key": API_KEY },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ElevenLabs voice clone failed (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.voice_id as string
}
