"use client"

import { motion } from "framer-motion"
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { ScrollReveal } from "./scroll-reveal"
import { useDeathBox } from "@/context/deathbox-context"

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px]">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-amber"
          animate={
            active
              ? {
                  height: [8, Math.random() * 40 + 10, 8],
                  opacity: [0.4, 0.9, 0.4],
                }
              : { height: 6, opacity: 0.15 }
          }
          transition={{
            duration: 0.8 + Math.random() * 0.6,
            repeat: active ? Infinity : 0,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  )
}

function RecordingTimer({ isRecording }: { isRecording: boolean }) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRecording) {
      setSeconds(0)
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRecording])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <p className="font-mono text-sm text-muted-foreground">
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </p>
  )
}

type Phase = "idle" | "recording" | "transcribing" | "analyzing" | "done" | "error"

export function VoiceRecordingSection() {
  const {
    isRecording,
    isTranscribing,
    isAnalyzing,
    transcript,
    analysisError,
    analysisResult,
    startRecording,
    stopRecording,
    processRecording,
    audioBlob,
  } = useDeathBox()

  const [displayedTranscript, setDisplayedTranscript] = useState("")
  const charIndexRef = useRef(0)

  // Determine current phase for UI
  let phase: Phase = "idle"
  if (isRecording) phase = "recording"
  else if (isTranscribing) phase = "transcribing"
  else if (isAnalyzing) phase = "analyzing"
  else if (analysisError) phase = "error"
  else if (analysisResult) phase = "done"

  // Typewriter effect for transcript
  useEffect(() => {
    if (!transcript) {
      setDisplayedTranscript("")
      charIndexRef.current = 0
      return
    }
    charIndexRef.current = 0
    setDisplayedTranscript("")

    const interval = setInterval(() => {
      charIndexRef.current++
      if (charIndexRef.current <= transcript.length) {
        setDisplayedTranscript(transcript.slice(0, charIndexRef.current))
      } else {
        clearInterval(interval)
      }
    }, 15)

    return () => clearInterval(interval)
  }, [transcript])

  // When recording stops, the audioBlob becomes available — trigger processing and scroll to step 3
  const prevBlobRef = useRef<Blob | null>(null)
  useEffect(() => {
    if (audioBlob && audioBlob !== prevBlobRef.current && !isRecording) {
      prevBlobRef.current = audioBlob
      processRecording(audioBlob)

      setTimeout(() => {
        document.getElementById("ai-processing")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 400)
    }
  }, [audioBlob, isRecording, processRecording])

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isRecording, startRecording, stopRecording])

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            Step 2
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            Just speak naturally
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-16 max-w-xl text-center text-lg text-muted-foreground">
            Talk about your finances like you would with a trusted advisor. Our
            AI listens, understands, and organizes everything.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-12">
            {/* Mic button */}
            <div className="mb-10 flex flex-col items-center gap-4">
              <div className="relative">
                {isRecording && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-amber/20"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-amber/10"
                      animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}

                <button
                  onClick={handleMicClick}
                  disabled={phase === "transcribing" || phase === "analyzing"}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all
                    ${
                      isRecording
                        ? "bg-red-500 glow-amber"
                        : phase === "transcribing" || phase === "analyzing"
                          ? "bg-amber/40 cursor-not-allowed"
                          : "bg-amber glow-amber-sm hover:brightness-110"
                    }`}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {phase === "transcribing" || phase === "analyzing" ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
                  ) : isRecording ? (
                    <MicOff className="h-8 w-8 text-white" />
                  ) : (
                    <Mic className="h-8 w-8 text-primary-foreground" />
                  )}
                </button>
              </div>

              {/* Status line */}
              <div className="flex items-center gap-2">
                {phase === "idle" && (
                  <p className="text-sm text-muted-foreground">
                    Tap to start recording
                  </p>
                )}
                {phase === "recording" && (
                  <>
                    <motion.div
                      className="h-2 w-2 rounded-full bg-red-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <p className="text-sm font-medium text-red-400">
                      Recording...
                    </p>
                    <RecordingTimer isRecording={isRecording} />
                  </>
                )}
                {phase === "transcribing" && (
                  <p className="text-sm text-amber">
                    Transcribing your voice...
                  </p>
                )}
                {phase === "analyzing" && (
                  <p className="text-sm text-amber">
                    AI is analyzing your finances...
                  </p>
                )}
                {phase === "done" && (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Analysis complete
                  </span>
                )}
                {phase === "error" && (
                  <span className="flex items-center gap-1.5 text-sm text-danger">
                    <AlertCircle className="h-4 w-4" />
                    {analysisError}
                  </span>
                )}
              </div>
            </div>

            {/* Waveform */}
            <div className="mb-10">
              <WaveformBars active={isRecording} />
            </div>

            {/* Transcript area — hidden once analysis is complete */}
            {phase !== "done" && (
            <div className="rounded-2xl border border-border bg-background p-6">
              <div className="mb-3 flex items-center gap-2">
                {(phase === "recording" || phase === "transcribing") && (
                  <motion.div
                    className="h-2 w-2 rounded-full bg-success"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {phase === "recording"
                    ? "Listening..."
                    : phase === "transcribing"
                      ? "Transcribing..."
                      : transcript
                        ? "Transcript"
                        : "Live Transcript"}
                </span>
              </div>
              <div className="min-h-[80px]">
                {displayedTranscript ? (
                  <p className="font-mono text-sm leading-relaxed text-foreground md:text-base">
                    {displayedTranscript}
                    {charIndexRef.current < transcript.length && (
                      <motion.span
                        className="ml-0.5 inline-block h-4 w-[2px] bg-amber"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      />
                    )}
                  </p>
                ) : phase === "recording" ? (
                  <p className="text-sm italic text-muted-foreground">
                    Speak about your 401k, insurance, bank accounts, debts,
                    subscriptions — anything financial your family should know
                    about...
                  </p>
                ) : phase === "transcribing" ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber" />
                    <p className="text-sm text-muted-foreground">
                      Processing audio with ElevenLabs...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your spoken words will appear here in real-time...
                  </p>
                )}
              </div>
            </div>
            )}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Powered by ElevenLabs Speech-to-Text &bull; Your voice is also
              used to create a personal narration for your family
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
