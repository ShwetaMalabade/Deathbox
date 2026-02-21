"use client"

import { useState, useEffect } from "react"
import { analyzeTranscript, extractDocument } from "./api"

export function GapFiller({
  packageData,
  setPackageData,
  onBack,
  onReview,
}: {
  packageData: any
  setPackageData: (p: any) => void
  onBack: () => void
  onReview: () => void
}) {
  const [currentMissingIndex, setCurrentMissingIndex] = useState(0)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMessages([])
    setCurrentMissingIndex(0)
  }, [packageData])

  const missing = packageData?.missing || []

  const remaining = Math.max(0, missing.length - currentMissingIndex)

  async function handleSendText(text: string) {
    if (!text) return
    try {
      setLoading(true)
      // call analyze
      const res = await analyzeTranscript(text)
      // replace packageData completely
      setPackageData(res)
      // append confirmation
      setMessages((m) => [...m, { role: "user", text }, { role: "assistant", text: "Saved." }])
      // move to next missing index
      setCurrentMissingIndex((i) => i + 1)
    } catch (e) {
      console.error(e)
      alert("Failed to analyze")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) return
    try {
      setLoading(true)
      const extracted = await extractDocument(file)
      const text = extracted.text || extracted.extracted || ""
      const res = await analyzeTranscript(text)
      setPackageData(res)
      setMessages((m) => [...m, { role: "user", text: `[uploaded file]` }, { role: "assistant", text: "Saved from upload." }])
      setCurrentMissingIndex((i) => i + 1)
    } catch (e) {
      console.error(e)
      alert("Upload failed")
    } finally {
      setLoading(false)
    }
  }

  if (!missing || missing.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h3 className="mb-4 text-2xl font-bold">All gaps filled</h3>
        <p className="mb-4 text-muted-foreground">No missing items remain.</p>
        <div className="flex gap-3">
          <button onClick={onReview} className="rounded-full bg-amber px-6 py-2 text-sm font-semibold text-primary-foreground">Review & Seal</button>
          <button onClick={onBack} className="rounded-full border border-border px-6 py-2 text-sm">Back to checklist</button>
        </div>
      </div>
    )
  }

  const current = missing[currentMissingIndex]

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold">Gap Filler</h3>
        <div className="text-sm text-muted-foreground">Items remaining: {remaining}</div>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-sm text-muted-foreground">Assistant</div>
        <div className="text-foreground">Please tell me about: <strong>{current?.title || current?.name || current?.section || "this item"}</strong></div>
      </div>

      <div className="mb-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 ${m.role === "assistant" ? "bg-background" : "bg-card"} rounded-md`}>
            <div className="text-sm text-muted-foreground">{m.role}</div>
            <div className="text-foreground">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <textarea
          className="mb-2 w-full rounded-md border border-border bg-background p-3 text-sm text-foreground"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response or paste a transcript"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleSendText(input)
              setInput("")
            }}
            disabled={loading}
            className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            {loading ? "Saving..." : "Send"}
          </button>

          <label className="rounded-full border border-border px-4 py-2 text-sm">
            Upload
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                handleUpload(f)
              }}
            />
          </label>

          <button onClick={onBack} className="rounded-full border border-border px-4 py-2 text-sm">Back to checklist</button>
          <button onClick={onReview} className="rounded-full border border-border px-4 py-2 text-sm">Skip remaining</button>
        </div>
      </div>
    </div>
  )
}
