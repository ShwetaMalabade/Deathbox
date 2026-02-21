"use client"

import { motion } from "framer-motion"
import { Mic } from "lucide-react"
import { useEffect, useState } from "react"
import { ScrollReveal } from "./scroll-reveal"

const transcript = [
  "I have a 401k through Fidelity with my employer...",
  "My health insurance is through Blue Cross Blue Shield...",
  "I have a car loan with Chase, about $12,000 remaining...",
  "Life insurance policy is through MetLife, $500k coverage...",
  "HSA account with Optum, around $8,200 balance...",
]

function WaveformBars() {
  return (
    <div className="flex items-center justify-center gap-[3px]">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-amber"
          animate={{
            height: [8, Math.random() * 40 + 10, 8],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  )
}

function TypewriterText({ texts }: { texts: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    const currentText = texts[currentIndex]
    if (charIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + currentText[charIndex])
        setCharIndex((prev) => prev + 1)
      }, 30 + Math.random() * 30)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length)
        setDisplayText("")
        setCharIndex(0)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [charIndex, currentIndex, texts])

  return (
    <p className="font-mono text-sm text-foreground md:text-base">
      {displayText}
      <motion.span
        className="ml-0.5 inline-block h-4 w-[2px] bg-amber"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
    </p>
  )
}

export function VoiceRecordingSection() {
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
            {/* Pulsing mic button */}
            <div className="mb-10 flex justify-center">
              <div className="relative">
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
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber glow-amber">
                  <Mic className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Waveform */}
            <div className="mb-10">
              <WaveformBars />
            </div>

            {/* Live transcript */}
            <div className="rounded-2xl border border-border bg-background p-6">
              <div className="mb-3 flex items-center gap-2">
                <motion.div
                  className="h-2 w-2 rounded-full bg-success"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Live Transcript
                </span>
              </div>
              <div className="min-h-[48px]">
                <TypewriterText texts={transcript} />
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Powered by ElevenLabs Speech-to-Text
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
