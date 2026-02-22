const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"

export interface AnalyzeResponse {
  found: Array<Record<string, unknown>>
  missing: Array<Record<string, unknown>>
  personal_info?: Record<string, unknown>
  employee_info?: Record<string, unknown>
}

export interface SealResponse {
  package_id: string
  solana_tx: string
  hash: string
  next_checkin: string
  message: string
}

/**
 * Send voice transcript to Gemini for financial data extraction.
 */
export async function analyzeTranscript(
  transcript: string
): Promise<AnalyzeResponse> {
  const res = await fetch(`${BACKEND}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Analyze failed (${res.status}): ${err}`)
  }
  return res.json()
}

/**
 * Upload a document image for data extraction via Gemini Vision.
 */
export async function extractDocument(
  file: File
): Promise<Record<string, unknown>> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${BACKEND}/api/extract-doc`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Extract doc failed (${res.status}): ${err}`)
  }
  return res.json()
}

/**
 * Send the user's audio to the backend for voice cloning.
 * Backend creates an ElevenLabs voice clone and returns the voice_id.
 */
export async function cloneVoiceOnBackend(
  audioBlob: Blob
): Promise<{ voice_id: string | null; skipped?: boolean; reason?: string }> {
  const formData = new FormData()
  formData.append("file", audioBlob, "voice_sample.webm")

  const res = await fetch(`${BACKEND}/api/clone-voice`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voice clone failed (${res.status}): ${err}`)
  }
  return res.json()
}

/**
 * Seal the package with all financial data + recipient info.
 */
export async function sealPackage(params: {
  package_data: Record<string, unknown>
  recipient_name?: string
  recipient_email?: string
  checkin_days?: number
  voice_id?: string
  skip_validation?: boolean
}): Promise<SealResponse> {
  const res = await fetch(`${BACKEND}/api/seal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Seal failed (${res.status}): ${err}`)
  }
  return res.json()
}

/**
 * Request the AI narration audio for a sealed package.
 * Returns the audio as a Blob (MP3) or a fallback text script.
 */
export async function getNarration(
  packageId: string
): Promise<{ audio?: Blob; script?: string }> {
  const res = await fetch(`${BACKEND}/api/narrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_id: packageId }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Narrate failed (${res.status}): ${err}`)
  }

  const contentType = res.headers.get("content-type") ?? ""
  if (contentType.includes("audio")) {
    const blob = await res.blob()
    return { audio: blob }
  }
  const data = await res.json()
  return { script: data.script }
}

/**
 * Retrieve a sealed package (family view).
 * If the dead man's switch hasn't expired, the package will be locked.
 * Pass force=true to bypass the timer for demo purposes.
 */
export async function getPackage(
  packageId: string,
  force = false
): Promise<PackageResponse> {
  const url = `${BACKEND}/api/package/${packageId}${force ? "?force=true" : ""}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Get package failed (${res.status}): ${err}`)
  }
  return res.json()
}

export interface PackageResponse {
  locked: boolean
  message?: string
  unlocks_at?: string
  days_remaining?: number
  package_id?: string
  package_data?: Record<string, unknown>
  recipient_name?: string
  created_at?: string
  solana_tx?: string
  transfer_tx?: string
  package_hash?: string
  verified?: boolean
}

/**
 * Reset the dead man's switch timer (prove you're still alive).
 */
export async function checkin(
  packageId: string
): Promise<{ message: string; next_checkin: string }> {
  const res = await fetch(`${BACKEND}/api/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_id: packageId }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Check-in failed (${res.status}): ${err}`)
  }
  return res.json()
}
