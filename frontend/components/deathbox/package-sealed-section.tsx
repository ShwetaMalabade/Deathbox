"use client"

import { motion, useInView } from "framer-motion"
import { Lock, Shield, ExternalLink, Loader2, CheckCircle2, User, Mail, Clock, Mic, Square, Trash2 } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import { ScrollReveal } from "./scroll-reveal"
import { useDeathBox } from "@/context/deathbox-context"

function VaultAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div ref={ref} className="relative mx-auto mb-14 flex h-48 w-48 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-amber/30"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-amber/20"
        initial={{ scale: 1.3, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-8 rounded-full bg-amber/10"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
      >
        <Lock className="relative z-10 h-12 w-12 text-amber" />
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-full bg-amber/20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1.5, opacity: [0, 0.5, 0] } : {}}
        transition={{ duration: 1, delay: 1.2 }}
      />
    </div>
  )
}

function SolanaHash({ txHash, network }: { txHash: string; network: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayHash, setDisplayHash] = useState("")

  useEffect(() => {
    if (!isInView) return
    let i = 0
    const interval = setInterval(() => {
      if (i <= txHash.length) {
        setDisplayHash(txHash.slice(0, i))
        i++
      } else {
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [isInView, txHash])

  const explorerUrl = `https://explorer.solana.com/tx/${txHash}?cluster=${network}`

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Seal — Blockchain Verification
          </span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-amber hover:underline"
        >
          Explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="font-mono text-sm text-foreground break-all">
        {displayHash}
        <motion.span
          className="ml-0.5 inline-block h-3.5 w-[2px] bg-amber"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Solana Devnet — Immutable Record
      </p>
    </div>
  )
}

function EmotionalMessageRecorder({
  onRecorded,
  blob,
  onRemove,
}: {
  onRecorded: (blob: Blob) => void
  blob: Blob | null
  onRemove: () => void
}) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const [duration, setDuration] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      recorder.onstop = () => {
        const recorded = new Blob(chunksRef.current, { type: recorder.mimeType })
        stream.getTracks().forEach((t) => t.stop())
        onRecorded(recorded)
        setIsRecording(false)
        if (timerRef.current) clearInterval(timerRef.current)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      alert("Microphone access required.")
    }
  }, [onRecorded])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, "0")}`
  }

  if (blob) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <span className="flex-1 text-sm text-foreground">Personal message recorded</span>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4">
      <p className="mb-3 text-xs text-muted-foreground">
        Record a personal voice message for your recipient. This is optional and separate from the AI-generated narration.
      </p>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
          isRecording
            ? "bg-danger text-white"
            : "border border-border bg-background text-foreground hover:border-amber hover:bg-amber/5"
        }`}
      >
        {isRecording ? (
          <>
            <Square className="h-3.5 w-3.5" />
            Stop Recording — {formatTime(duration)}
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            Record Personal Message
          </>
        )}
      </button>
    </div>
  )
}

export function PackageSealedSection() {
  const {
    analysisResult, sealResult, isSealing, sealCurrentPackage,
    checkinDays, setCheckinDays,
    recipientName, setRecipientName,
    recipientEmail, setRecipientEmail,
    emotionalMessageBlob, setEmotionalMessageBlob,
    isSettingsSaved, saveSettings,
  } = useDeathBox()

  const hasTriggeredSeal = useRef(false)

  useEffect(() => {
    if (analysisResult && !sealResult && !isSealing && !hasTriggeredSeal.current) {
      hasTriggeredSeal.current = true
      sealCurrentPackage().catch((err) => {
        console.error("Auto-seal failed:", err)
        hasTriggeredSeal.current = false
      })
    }
  }, [analysisResult, sealResult, isSealing, sealCurrentPackage])

  const solanaTx = sealResult?.solana_tx || ""
  const canSave = recipientName.trim().length > 0 && recipientEmail.trim().length > 0 && checkinDays > 0

  const handleSave = () => {
    if (!canSave) return
    saveSettings()
  }

  return (
    <section id="package-sealed" className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            Secured
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            {isSealing ? "Sealing your package..." : "Package sealed"}
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-16 max-w-xl text-center text-lg text-muted-foreground">
            {isSealing
              ? "Writing your data hash to Solana blockchain for tamper-proof verification..."
              : "Your information is encrypted and verified on-chain. Now configure when and to whom it should be delivered."}
          </p>
        </ScrollReveal>

        {isSealing && (
          <div className="flex justify-center mb-14">
            <Loader2 className="h-16 w-16 animate-spin text-amber" />
          </div>
        )}

        {!isSealing && sealResult && (
          <>
            <VaultAnimation />

            <div className="flex flex-col gap-5">
              {solanaTx && (
                <ScrollReveal delay={0.4}>
                  <SolanaHash txHash={solanaTx} network="devnet" />
                </ScrollReveal>
              )}

              {/* Settings form — shown before save */}
              {!isSettingsSaved && (
                <ScrollReveal delay={0.5}>
                  <div className="rounded-xl border border-amber/20 bg-card p-6">
                    <h3 className="mb-1 text-base font-semibold text-foreground">
                      Delivery Settings
                    </h3>
                    <p className="mb-6 text-sm text-muted-foreground">
                      Configure when and to whom this package should be released.
                    </p>

                    <div className="space-y-5">
                      {/* 1. Inactivity days */}
                      <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Days of Inactivity Before Release
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={checkinDays}
                            onChange={(e) => setCheckinDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                          />
                          <span className="text-sm text-muted-foreground">
                            days without check-in triggers delivery
                          </span>
                        </div>
                      </div>

                      {/* 2. Recipient name */}
                      <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <User className="h-3 w-3" />
                          Recipient Name
                        </label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="e.g. Sarah"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                        />
                      </div>

                      {/* 3. Recipient email */}
                      <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          Recipient Email
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="e.g. sarah@email.com"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                        />
                      </div>

                      {/* 4. Optional emotional message */}
                      <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Mic className="h-3 w-3" />
                          Personal Voice Message (Optional)
                        </label>
                        <EmotionalMessageRecorder
                          blob={emotionalMessageBlob}
                          onRecorded={setEmotionalMessageBlob}
                          onRemove={() => setEmotionalMessageBlob(null)}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={!canSave}
                      className="mt-6 flex items-center gap-2 rounded-full bg-amber px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Save Settings
                    </button>
                  </div>
                </ScrollReveal>
              )}

              {/* Confirmation — shown after save */}
              {isSettingsSaved && (
                <ScrollReveal delay={0.1}>
                  <div className="rounded-xl border border-success/30 bg-success/5 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-base font-semibold text-success">
                        Everything is saved!
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your package will be released to{" "}
                      <span className="font-medium text-foreground">{recipientName}</span>
                      {" "}at{" "}
                      <span className="font-medium text-foreground">{recipientEmail}</span>
                      {" "}after{" "}
                      <span className="font-medium text-foreground">{checkinDays} days</span>
                      {" "}of inactivity.
                      {emotionalMessageBlob && " A personal voice message is included."}
                      {" "}Scroll down to preview what they&#39;ll receive.
                    </p>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
