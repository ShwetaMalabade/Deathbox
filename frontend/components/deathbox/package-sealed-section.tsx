"use client"

import { motion, useInView } from "framer-motion"
import { Lock, Shield, Clock } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ScrollReveal } from "./scroll-reveal"

function VaultAnimation() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div ref={ref} className="relative mx-auto mb-14 flex h-48 w-48 items-center justify-center">
      {/* Outer vault ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-amber/30"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute inset-4 rounded-full border border-amber/20"
        initial={{ scale: 1.3, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      />

      {/* Inner circle */}
      <motion.div
        className="absolute inset-8 rounded-full bg-amber/10"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      />

      {/* Lock icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
      >
        <Lock className="relative z-10 h-12 w-12 text-amber" />
      </motion.div>

      {/* Completion flash */}
      <motion.div
        className="absolute inset-0 rounded-full bg-amber/20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1.5, opacity: [0, 0.5, 0] } : {}}
        transition={{ duration: 1, delay: 1.2 }}
      />
    </div>
  )
}

function SolanaHash() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayHash, setDisplayHash] = useState("")
  const fullHash = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA93TZzHtjQ3Kd7"

  useEffect(() => {
    if (!isInView) return
    let i = 0
    const interval = setInterval(() => {
      if (i <= fullHash.length) {
        setDisplayHash(fullHash.slice(0, i))
        i++
      } else {
        clearInterval(interval)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Blockchain Verification
        </span>
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
        Solana Mainnet - Immutable Record
      </p>
    </div>
  )
}

function DeadManSwitch() {
  const [days, setDays] = useState(30)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 0) return prev - 1
        setMinutes((m) => {
          if (m > 0) return m - 1
          setHours((h) => {
            if (h > 0) return h - 1
            setDays((d) => Math.max(0, d - 1))
            return 23
          })
          return 59
        })
        return 59
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {"Dead Man's Switch"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-center">
        {[
          { value: days, label: "Days" },
          { value: hours, label: "Hours" },
          { value: minutes, label: "Min" },
          { value: seconds, label: "Sec" },
        ].map((unit) => (
          <div key={unit.label}>
            <p className="font-mono text-2xl font-bold text-amber md:text-3xl">
              {String(unit.value).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">{unit.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Check in before the timer expires to keep your package sealed
      </p>
    </div>
  )
}

export function PackageSealedSection() {
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
            Package sealed
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-16 max-w-xl text-center text-lg text-muted-foreground">
            Your information is encrypted, verified on-chain, and locked until
            it is needed. Only you control when it opens.
          </p>
        </ScrollReveal>

        <VaultAnimation />

        <div className="flex flex-col gap-4">
          <ScrollReveal delay={0.4}>
            <SolanaHash />
          </ScrollReveal>
          <ScrollReveal delay={0.5}>
            <DeadManSwitch />
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
