"use client"

import { useState } from "react"
import { analyzeTranscript } from "./api"

export function RecordingScreen({ onDone }: { onDone: (data: any) => void }) {
  const [typed, setTyped] = useState("")
  const [transcript, setTranscript] = useState(
    "I have a 401k with Fidelity and a car loan with Chase."
  )
  const [loading, setLoading] = useState(false)

  async function handleFinish() {
    try {
      setLoading(true)
      const combined = `${transcript}\n\n${typed}`
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
        <p className="mb-2 text-sm font-medium text-muted-foreground">Live Transcript</p>
        <div className="min-h-[64px] text-foreground">{transcript}</div>
      </div>

      <label className="mb-2 block text-sm font-medium text-muted-foreground">
        Prefer to type anything else?
      </label>
      <textarea
        className="mb-4 w-full rounded-md border border-border bg-background p-3 text-sm text-foreground"
        rows={4}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="Add any missing details here"
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
