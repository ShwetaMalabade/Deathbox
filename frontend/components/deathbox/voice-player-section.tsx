"use client"

import { motion, useInView } from "framer-motion"
import { Play, Pause, Volume2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ScrollReveal } from "./scroll-reveal"

const narrationLines = [
  "Sarah, if you are hearing this, I want you to know that everything has been taken care of.",
  "I have organized all of our financial accounts, insurance policies, and important documents.",
  "The 401k with Fidelity has about $142,000. You are the beneficiary.",
  "Our health insurance through Blue Cross will need to be continued with COBRA within 60 days.",
  "The mortgage at Wells Fargo has $285,000 remaining. The life insurance should cover most of it.",
  "I love you. You are going to be okay.",
]

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

function NarrationTranscript({
  isPlaying,
  lines,
}: {
  isPlaying: boolean
  lines: string[]
}) {
  const [currentLine, setCurrentLine] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (!isPlaying) return
    const line = lines[currentLine]
    if (charIndex < line.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + line[charIndex])
        setCharIndex((prev) => prev + 1)
      }, 35 + Math.random() * 25)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        if (currentLine < lines.length - 1) {
          setCurrentLine((prev) => prev + 1)
          setDisplayText("")
          setCharIndex(0)
        }
      }, 1500)
      return () => clearTimeout(timeout)
    }
  }, [charIndex, currentLine, isPlaying, lines])

  return (
    <div className="min-h-[80px] rounded-xl border border-border bg-background p-5">
      <p className="text-sm leading-relaxed text-foreground md:text-base">
        {displayText}
        {isPlaying && (
          <motion.span
            className="ml-0.5 inline-block h-4 w-[2px] bg-amber"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </p>
      {!isPlaying && !displayText && (
        <p className="text-sm text-muted-foreground">
          Press play to hear the AI narration...
        </p>
      )}
    </div>
  )
}

export function VoicePlayerSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => setIsPlaying(true), 1500)
      return () => clearTimeout(timeout)
    }
  }, [isInView])

  return (
    <section ref={ref} className="relative px-6 py-32 md:py-40">
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
            Your words, narrated with warmth and clarity. A personal message
            that guides your family through every step.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
            {/* Player controls */}
            <div className="mb-8 flex items-center gap-6">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
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
                  Personal Message for Sarah
                </p>
                <p className="text-sm text-muted-foreground">
                  AI Narration - 4:32
                </p>
              </div>
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-1 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-amber"
                  initial={{ width: "0%" }}
                  animate={isPlaying ? { width: "100%" } : {}}
                  transition={{ duration: 60, ease: "linear" }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>0:00</span>
                <span>4:32</span>
              </div>
            </div>

            {/* Waveform */}
            <div className="mb-6">
              <MiniWaveform isPlaying={isPlaying} />
            </div>

            {/* Live transcript */}
            <div className="mb-3 flex items-center gap-2">
              {isPlaying && (
                <motion.div
                  className="h-2 w-2 rounded-full bg-success"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Transcript
              </span>
            </div>
            <NarrationTranscript isPlaying={isPlaying} lines={narrationLines} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
