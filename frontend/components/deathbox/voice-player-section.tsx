"use client"

import { motion } from "framer-motion"
import { Play, Pause, Volume2, Loader2, AlertCircle, Heart, FileText } from "lucide-react"
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

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, "0")}`
}

function AudioPlayer({
  src,
  title,
  subtitle,
  icon: Icon,
  accentClass,
}: {
  src: string
  title: string
  subtitle: string
  icon: typeof Play
  accentClass?: string
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
  }, [src])

  return (
    <div>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="mb-6 flex items-center gap-5">
        <button
          onClick={togglePlay}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-primary-foreground transition-transform hover:scale-105 active:scale-95 ${accentClass || "bg-amber glow-amber-sm"}`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="ml-1 h-6 w-6" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="font-semibold text-foreground truncate">{title}</p>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}{duration > 0 ? ` — ${formatTime(duration)}` : ""}</p>
        </div>
        <Volume2 className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>

      <div className="mb-4">
        <div className="h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-amber transition-all"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <MiniWaveform isPlaying={isPlaying} />
    </div>
  )
}

export function VoicePlayerSection() {
  const { analysisResult, voiceId, sealResult, recipientName, emotionalMessageBlob } = useDeathBox()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [narrationUrl, setNarrationUrl] = useState<string | null>(null)
  const [fallbackScript, setFallbackScript] = useState<string | null>(null)
  const [personalMessageUrl, setPersonalMessageUrl] = useState<string | null>(null)

  const derivedRecipientName =
    recipientName
    || (analysisResult?.personal_info as Record<string, unknown>)?.spouse as string
    || (analysisResult?.employee_info as Record<string, unknown>)?.spouse as string
    || "your loved one"

  // Create object URL for the emotional message blob
  useEffect(() => {
    if (emotionalMessageBlob) {
      const url = URL.createObjectURL(emotionalMessageBlob)
      setPersonalMessageUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setPersonalMessageUrl(null)
    }
  }, [emotionalMessageBlob])

  // Cleanup narration URL
  useEffect(() => {
    return () => {
      if (narrationUrl) URL.revokeObjectURL(narrationUrl)
    }
  }, [narrationUrl])

  const handleGenerate = useCallback(async () => {
    const pid = sealResult?.package_id
    if (!pid) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await getNarration(pid)

      if (result.audio) {
        const url = URL.createObjectURL(result.audio)
        setNarrationUrl(url)
        setFallbackScript(null)
      } else if (result.script) {
        setFallbackScript(result.script)
        setNarrationUrl(null)
      }
    } catch (err) {
      console.error("Narration error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate narration")
    } finally {
      setIsLoading(false)
    }
  }, [sealResult])

  const hasNarration = !!narrationUrl
  const hasScript = !!fallbackScript
  const hasPersonalMessage = !!personalMessageUrl

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
            {hasPersonalMessage
              ? `A heartfelt message in your own words, followed by a guided walkthrough of every financial detail ${derivedRecipientName} needs.`
              : voiceId
                ? "Your own voice, narrating a personal message that guides your family through every step."
                : "Your words, narrated with warmth and clarity. A personal message that guides your family through every step."}
          </p>
        </ScrollReveal>

        <div className="flex flex-col gap-6">
          {/* Personal voice note — the emotional recording */}
          {hasPersonalMessage && (
            <ScrollReveal delay={0.3}>
              <div className="overflow-hidden rounded-3xl border border-amber/30 bg-card p-8 md:p-10">
                <div className="mb-6 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-amber" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber">
                    Personal Voice Note
                  </span>
                </div>
                <AudioPlayer
                  src={personalMessageUrl!}
                  title={`A message for ${derivedRecipientName}`}
                  subtitle="In their own voice"
                  icon={Heart}
                  accentClass="bg-amber glow-amber-sm"
                />
              </div>
            </ScrollReveal>
          )}

          {/* AI narration — the financial walkthrough */}
          <ScrollReveal delay={hasPersonalMessage ? 0.4 : 0.3}>
            <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
              <div className="mb-6 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {hasPersonalMessage ? "Financial Walkthrough" : "AI Narration"}
                </span>
              </div>

              {!hasNarration && !hasScript ? (
                <div className="flex flex-col items-center gap-6 py-4">
                  <p className="max-w-md text-center text-muted-foreground">
                    {hasPersonalMessage
                      ? `Now generate a detailed walkthrough that covers every account, policy, and subscription — so ${derivedRecipientName} knows exactly what to do.`
                      : `Generate an AI narration${voiceId ? " in your own voice" : ""} that walks ${derivedRecipientName} through everything.`}
                  </p>

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
                        Generate Financial Walkthrough
                      </>
                    )}
                  </button>
                  {voiceId && (
                    <p className="text-xs text-success">Using your cloned voice</p>
                  )}
                  {!voiceId && (
                    <p className="text-xs text-muted-foreground">Will use the default narrator voice</p>
                  )}
                  {error && (
                    <span className="flex items-center gap-1.5 text-sm text-danger">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </span>
                  )}
                </div>
              ) : hasNarration ? (
                <AudioPlayer
                  src={narrationUrl!}
                  title={`Financial details for ${derivedRecipientName}`}
                  subtitle={voiceId ? "Your Voice — AI Narration" : "AI Narration"}
                  icon={FileText}
                  accentClass="bg-amber glow-amber-sm"
                />
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
      </div>
    </section>
  )
}
