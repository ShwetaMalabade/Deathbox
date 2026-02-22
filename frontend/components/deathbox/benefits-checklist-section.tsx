"use client"

import { motion, useInView } from "framer-motion"
import { Check, AlertTriangle, X, Mic, Square, Upload, Loader2, AlertCircle } from "lucide-react"
import { useRef, useMemo, useState, useCallback } from "react"
import { ScrollReveal } from "./scroll-reveal"
import { useDeathBox } from "@/context/deathbox-context"
import { speechToText } from "@/lib/elevenlabs"
import { analyzeTranscript, extractDocument } from "@/lib/api"

type BenefitStatus = "found" | "missing" | "unknown"

interface BenefitItem {
  name: string
  status: BenefitStatus
  detail: string
}

const EMPTY_BENEFITS: BenefitItem[] = []

function flattenIfNeeded(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const flat: Array<Record<string, unknown>> = []
    for (const [catKey, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === "object") {
            if (!("type" in item)) (item as Record<string, unknown>).type = catKey.replace(/s$/, "")
            flat.push(item as Record<string, unknown>)
          }
        }
      } else if (items && typeof items === "object") {
        flat.push(items as Record<string, unknown>)
      }
    }
    return flat
  }
  return []
}

function buildBenefitsFromAnalysis(
  rawFound: unknown,
  rawMissing: unknown
): BenefitItem[] {
  const found = flattenIfNeeded(rawFound)
  const missing = flattenIfNeeded(rawMissing)
  const items: BenefitItem[] = []

  for (const f of found) {
    const rawType =
      (f.type as string) ??
      (f.category as string) ??
      (f.name as string) ??
      (f.title as string) ??
      "Financial Item"
    const typeName = rawType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    const bank = (f.bank_name ?? f.provider ?? f.institution ?? f.issuer ?? f.lender ?? "") as string
    const name = bank ? `${typeName} — ${bank}` : typeName
    const balance = f.balance != null ? `$${Number(f.balance).toLocaleString()}` : ""
    const acctType = (f.account_type ?? f.policy_type ?? "") as string
    const confidence = (f.confidence as string) ?? "certain"

    const detail = [acctType, balance].filter(Boolean).join(" — ") || "Details captured"
    const status: BenefitStatus = confidence === "uncertain" ? "unknown" : "found"

    items.push({ name, status, detail })
  }

  for (const m of missing) {
    const rawName =
      (m.name as string) ??
      (m.title as string) ??
      (m.category as string) ??
      (m.type as string) ??
      null
    const name = rawName
      ? rawName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Missing Detail"
    const reason = (m.why_it_matters as string) ?? (m.reason as string) ?? (m.description as string) ?? "Not mentioned in recording"
    items.push({ name, status: "missing", detail: reason })
  }

  return items
}

function StatusIcon({ status }: { status: BenefitStatus }) {
  if (status === "found") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15">
        <Check className="h-4 w-4 text-success" />
      </div>
    )
  }
  if (status === "unknown") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/15">
        <AlertTriangle className="h-4 w-4 text-warning" />
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/15">
      <X className="h-4 w-4 text-danger" />
    </div>
  )
}

function BenefitRow({ item, index }: { item: BenefitItem; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-30px" })

  return (
    <motion.div
      ref={ref}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-amber/20 ${
        item.status === "missing"
          ? "border-danger/20 bg-danger/5"
          : item.status === "unknown"
          ? "border-warning/20 bg-warning/5"
          : "border-border bg-card"
      }`}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <StatusIcon status={item.status} />
      <div className="flex-1">
        <h4 className="font-medium text-foreground">{item.name}</h4>
        <p className="text-sm text-muted-foreground">{item.detail}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          item.status === "found"
            ? "bg-success/10 text-success"
            : item.status === "unknown"
              ? "bg-warning/10 text-warning"
              : "bg-danger/10 text-danger"
        }`}
      >
        {item.status === "found"
          ? "Found"
          : item.status === "unknown"
            ? "Unverified"
            : "Missing"}
      </span>
    </motion.div>
  )
}

function GapFillerPanel({ onNewData }: { onNewData: (text: string) => Promise<void> }) {
  const [isRecording, setIsRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [loading, setLoading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const chunksRef = useRef<BlobPart[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        stream.getTracks().forEach((t) => t.stop())
        setIsRecording(false)

        try {
          setLoading(true)
          const text = await speechToText(blob)
          setLiveTranscript(text)
          await onNewData(text)
        } catch (err) {
          console.error("Voice gap fill failed:", err)
          if (liveTranscript) await onNewData(liveTranscript)
        } finally {
          setLoading(false)
        }
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"
        let finalText = ""
        recognition.onresult = (event: any) => {
          let interim = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript
            if (event.results[i].isFinal) finalText += t + " "
            else interim += t
          }
          setLiveTranscript(finalText + interim)
        }
        recognition.onerror = () => {}
        recognition.start()
        recognitionRef.current = recognition
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setLiveTranscript("")
    } catch {
      alert("Microphone access required.")
    }
  }, [liveTranscript, onNewData])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }, [])

  async function handleFileUpload(file: File | null) {
    if (!file) return
    try {
      setLoading(true)
      const extracted = await extractDocument(file)
      const text =
        (extracted as any).text ||
        (extracted as any).extracted ||
        JSON.stringify(extracted)
      await onNewData(text)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber/30 bg-amber/5 p-6">
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber">
        Fill the gaps
      </h4>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
            isRecording
              ? "bg-danger text-white"
              : "bg-amber text-primary-foreground hover:brightness-110"
          } disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isRecording ? (
            <>
              <Square className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Add via Voice
            </>
          )}
        </button>

        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          <Upload className="h-4 w-4" />
          {loading ? "Processing..." : "Upload Document"}
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
            disabled={loading}
          />
        </label>
      </div>

      {(isRecording || liveTranscript) && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm text-foreground">
            {liveTranscript || (
              <span className="italic text-muted-foreground">Listening...</span>
            )}
            {isRecording && (
              <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-amber" />
            )}
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-amber" />
          Analyzing new information...
        </div>
      )}
    </div>
  )
}

export function BenefitsChecklistSection() {
  const { analysisResult, updateAnalysis } = useDeathBox()
  const [showGapFiller, setShowGapFiller] = useState(false)

  const active = analysisResult
  const hasRealData = !!(
    active?.found &&
    (Array.isArray(active.found) ? active.found.length > 0 : typeof active.found === "object" && Object.keys(active.found).length > 0)
  ) || !!(
    active?.missing &&
    (Array.isArray(active.missing) ? active.missing.length > 0 : typeof active.missing === "object" && Object.keys(active.missing).length > 0)
  )

  const benefits = useMemo(() => {
    if (!hasRealData) return EMPTY_BENEFITS
    return buildBenefitsFromAnalysis(active!.found ?? [], active!.missing ?? [])
  }, [active, hasRealData])

  const foundCount = benefits.filter((b) => b.status === "found").length
  const missingCount = benefits.filter((b) => b.status === "missing").length
  const unknownCount = benefits.filter((b) => b.status === "unknown").length

  const handleNewGapData = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      try {
        const result = await analyzeTranscript(text)
        const prevFound = active?.found ?? []
        const prevMissing = active?.missing ?? []
        const prevPersonal = (active?.personal_info ?? {}) as Record<string, unknown>

        const newFoundItems = result.found ?? []

        const coveredTypes = new Set(
          newFoundItems.map((f: Record<string, unknown>) =>
            `${f.type || ""}`.toLowerCase()
          )
        )
        const coveredNames = new Set(
          newFoundItems.flatMap((f: Record<string, unknown>) =>
            [f.bank_name, f.provider, f.name, f.institution, f.issuer]
              .filter(Boolean)
              .map((n) => `${n}`.toLowerCase())
          )
        )
        const remainingMissing = (prevMissing as Array<Record<string, unknown>>).filter((m) => {
          const mType = `${m.type || ""}`.toLowerCase()
          const mName = `${m.name || ""}`.toLowerCase()
          if (coveredTypes.has(mType)) return false
          for (const cn of coveredNames) {
            if (mName.includes(cn)) return false
          }
          return true
        })

        const merged = {
          found: [...prevFound, ...newFoundItems],
          missing: remainingMissing,
          personal_info: { ...prevPersonal, ...(result.personal_info ?? {}) },
        }
        updateAnalysis(merged)
      } catch (err) {
        console.error("Gap fill analysis failed:", err)
      }
    },
    [active, updateAnalysis]
  )

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            Step 4
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            Your benefits, verified
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-10 max-w-xl text-center text-lg text-muted-foreground">
            We cross-reference everything you mentioned with your employer
            benefits and flag anything that is missing or needs attention.
          </p>
        </ScrollReveal>

        {/* Missing info popup */}
        {hasRealData && missingCount > 0 && (
          <ScrollReveal delay={0.25}>
            <div className="mb-8 rounded-2xl border border-danger/30 bg-danger/5 p-6">
              <div className="mb-3 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-danger" />
                <h3 className="font-semibold text-foreground">
                  {missingCount} detail{missingCount > 1 ? "s" : ""} missing
                </h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                We couldn't find these in your recording. Add them now by
                speaking or uploading a document.
              </p>
              <ul className="mb-4 space-y-1.5">
                {benefits
                  .filter((b) => b.status === "missing")
                  .slice(0, 5)
                  .map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <X className="h-3.5 w-3.5 shrink-0 text-danger" />
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground">— {item.detail}</span>
                    </li>
                  ))}
              </ul>
              {!showGapFiller && (
                <button
                  onClick={() => setShowGapFiller(true)}
                  className="flex items-center gap-2 rounded-full bg-amber px-5 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <Mic className="h-4 w-4" />
                  Fill These Gaps
                </button>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Summary cards */}
        <ScrollReveal delay={0.3}>
          <div className="mb-10 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
              <p className="text-3xl font-bold text-success">{foundCount}</p>
              <p className="text-sm text-muted-foreground">Found</p>
            </div>
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-center">
              <p className="text-3xl font-bold text-warning">{unknownCount}</p>
              <p className="text-sm text-muted-foreground">Unverified</p>
            </div>
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
              <p className="text-3xl font-bold text-danger">{missingCount}</p>
              <p className="text-sm text-muted-foreground">Missing</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Benefits list */}
        <div className="flex flex-col gap-3">
          {benefits.map((item, i) => (
            <BenefitRow key={`${item.name}-${i}`} item={item} index={i} />
          ))}
        </div>

        {/* Gap filler panel */}
        {showGapFiller && hasRealData && (
          <GapFillerPanel onNewData={handleNewGapData} />
        )}
      </div>
    </section>
  )
}
