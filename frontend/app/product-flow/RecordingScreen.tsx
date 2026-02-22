"use client"

import { useState } from "react"
import { analyzeTranscript } from "./api"

export function RecordingScreen({ onDone }: { onDone: (data: any) => void }) {
  const [inputMode, setInputMode] = useState<"voice_text" | "text_only">("voice_text")
  const [typed, setTyped] = useState("")
  const [transcript, setTranscript] = useState(
    "I have a 401k with Fidelity and a car loan with Chase."
  )
  const [loading, setLoading] = useState(false)

  async function handleFinish() {
    const voicePart = inputMode === "voice_text" ? transcript.trim() : ""
    const textPart = typed.trim()
    const combined = [voicePart, textPart].filter(Boolean).join("\n\n")

    if (!combined) {
      alert("Please provide voice transcript or type details before analyzing.")
      return
    }

    try {
      setLoading(true)
      const json = await analyzeTranscript(combined)
      // replace packageData completely
      onDone(json)
    } catch (e) {
      console.error(e)
      alert("Failed to analyze transcript")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h3 className="mb-4 text-2xl font-bold">Recording</h3>

      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Input mode</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setInputMode("voice_text")}
            className={`rounded-full px-4 py-2 text-sm ${inputMode === "voice_text" ? "bg-amber text-primary-foreground" : "border border-border text-foreground"}`}
          >
            Voice + Text
          </button>
          <button
            type="button"
            onClick={() => setInputMode("text_only")}
            className={`rounded-full px-4 py-2 text-sm ${inputMode === "text_only" ? "bg-amber text-primary-foreground" : "border border-border text-foreground"}`}
          >
            Text only
          </button>
        </div>
      </div>

      {inputMode === "voice_text" && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">Voice transcript</p>
          <textarea
            className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground"
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Voice transcript appears here..."
          />
        </div>
      )}

      <label className="mb-2 block text-sm font-medium text-muted-foreground">
        Add details as text
      </label>
      <textarea
        className="mb-4 w-full rounded-md border border-border bg-background p-3 text-sm text-foreground"
        rows={5}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="Type financial details here (works even without voice/ElevenLabs)"
      />

      <div className="flex gap-3">
        <button
          onClick={handleFinish}
          disabled={loading}
          className="glow-amber rounded-full bg-amber px-6 py-2 text-sm font-semibold text-primary-foreground"
        >
          {loading ? "Analyzing..." : "Finish & Analyze"}
        </button>
      </div>
    </div>
  )
}
