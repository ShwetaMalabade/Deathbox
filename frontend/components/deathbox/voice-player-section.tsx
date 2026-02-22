"use client"

import { motion } from "framer-motion"
import { Play, Pause, Volume2, Loader2, AlertCircle } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import { ScrollReveal } from "./scroll-reveal"
import { useDeathBox } from "@/context/deathbox-context"
import { getNarration } from "@/lib/api"

function MiniWaveform({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: 60 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-amber"
          animate={
            isPlaying
              ? {
                  height: [4, Math.random() * 24 + 6, 4],
                  opacity: [0.3, 0.7, 0.3],
                }
              : { height: 4, opacity: 0.2 }
          }
          transition={{
            duration: 0.6 + Math.random() * 0.4,
            repeat: isPlaying ? Infinity : 0,
            ease: "easeInOut",
            delay: i * 0.02,
          }}
        />
      ))}
    </div>
  )
}

export function VoicePlayerSection() {
  const {
    analysisResult, voiceId, sealResult, sealCurrentPackage,
    recipientName, recipientEmail, setRecipientName, setRecipientEmail,
  } = useDeathBox()

  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [fallbackScript, setFallbackScript] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const derivedRecipientName =
    recipientName
    || (analysisResult?.personal_info as Record<string, unknown>)?.spouse as string
    || (analysisResult?.employee_info as Record<string, unknown>)?.spouse as string
    || "your loved one"

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, "0")}`
  }

  // Clean up object URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const handleGenerate = useCallback(async () => {
    if (!analysisResult) return
    setIsLoading(true)
    setError(null)

    try {
      let pid = sealResult?.package_id

      if (!pid) {
        const sealed = await sealCurrentPackage(
          derivedRecipientName,
          recipientEmail || "demo@deathbox.app"
        )
        pid = sealed.package_id
      }

      const result = await getNarration(pid)

      if (result.audio) {
        const url = URL.createObjectURL(result.audio)
        setAudioUrl(url)
        setFallbackScript(null)
      } else if (result.script) {
        setFallbackScript(result.script)
        setAudioUrl(null)
      }

      setTimeout(() => {
        document.getElementById("package-sealed")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 400)
    } catch (err) {
      console.error("Narration error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate narration")
    } finally {
      setIsLoading(false)
    }
  }, [analysisResult, sealResult, sealCurrentPackage, derivedRecipientName, recipientEmail])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("ended", onEnded)
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("ended", onEnded)
    }
  }, [audioUrl])

  const hasAnalysis = !!analysisResult
  const hasAudio = !!audioUrl
  const hasScript = !!fallbackScript

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            Personal Message
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            A voice they will remember
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-16 max-w-xl text-center text-lg text-muted-foreground">
            {voiceId
              ? "Your own voice, narrating a personal message that guides your family through every step."
              : "Your words, narrated with warmth and clarity. A personal message that guides your family through every step."}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
            {!hasAudio && !hasScript ? (
              <div className="flex flex-col items-center gap-6 py-8">
                {!hasAnalysis ? (
                  <p className="text-center text-muted-foreground">
                    Record your voice above first — then come here to generate
                    the narration for your family.
                  </p>
                ) : (
                  <>
                    <p className="max-w-md text-center text-muted-foreground">
                      Your financial data is ready. Generate an AI narration
                      {voiceId ? " in your own voice " : " "}
                      that walks {derivedRecipientName} through everything.
                    </p>

                    {/* Recipient info */}
                    <div className="w-full max-w-md space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Recipient Name
                        </label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder={
                            (analysisResult?.personal_info as Record<string, unknown>)?.spouse as string
                            || "e.g. Sarah"
                          }
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="flex items-center gap-2 rounded-full bg-amber px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed glow-amber-sm"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating narration...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Generate Voice Message
                        </>
                      )}
                    </button>
                    {voiceId && (
                      <p className="text-xs text-success">
                        Using your cloned voice
                      </p>
                    )}
                    {!voiceId && (
                      <p className="text-xs text-muted-foreground">
                        Will use the default narrator voice
                      </p>
                    )}
                    {error && (
                      <span className="flex items-center gap-1.5 text-sm text-danger">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : hasAudio ? (
              <>
                <audio ref={audioRef} src={audioUrl!} preload="metadata" />

                {/* Player controls */}
                <div className="mb-8 flex items-center gap-6">
                  <button
                    onClick={togglePlay}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-amber text-primary-foreground transition-transform hover:scale-105 active:scale-95 glow-amber-sm"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="ml-1 h-6 w-6" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      Personal Message for {derivedRecipientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {voiceId ? "Your Voice" : "AI Narration"} — {formatTime(duration)}
                    </p>
                  </div>
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                  <div className="h-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-amber transition-all"
                      style={{
                        width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Waveform */}
                <div className="mb-6">
                  <MiniWaveform isPlaying={isPlaying} />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-amber"
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Narration Script (audio unavailable)
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-background p-6">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground md:text-base">
                    {fallbackScript}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
