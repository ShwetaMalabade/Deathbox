"use client"

import { motion, useInView } from "framer-motion"
import { Lock, Shield, Clock, ExternalLink, Send, Loader2, CheckCircle2 } from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"
import { ScrollReveal } from "./scroll-reveal"
import { useDeathBox } from "@/context/deathbox-context"
import { getPackage } from "@/lib/api"

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

function SolanaHash({ label, txHash, network }: { label: string; txHash: string; network: string }) {
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
            {label}
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
  const { sealResult, recipientEmail } = useDeathBox()
  const [isReleasing, setIsReleasing] = useState(false)
  const [releaseResult, setReleaseResult] = useState<{
    transfer_tx?: string
    recipient_name?: string
  } | null>(null)
  const [releaseError, setReleaseError] = useState<string | null>(null)

  const handleDemoRelease = useCallback(async () => {
    if (!sealResult?.package_id) return
    setIsReleasing(true)
    setReleaseError(null)
    try {
      const result = await getPackage(sealResult.package_id, true)
      if (!result.locked) {
        setReleaseResult({
          transfer_tx: result.transfer_tx,
          recipient_name: result.recipient_name,
        })
      }
    } catch (err) {
      console.error("Release error:", err)
      setReleaseError(err instanceof Error ? err.message : "Release failed")
    } finally {
      setIsReleasing(false)
    }
  }, [sealResult])

  const solanaTx = sealResult?.solana_tx || ""

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
          {/* Register tx (from sealing) */}
          {solanaTx && (
            <ScrollReveal delay={0.4}>
              <SolanaHash label="Seal — Blockchain Verification" txHash={solanaTx} network="devnet" />
            </ScrollReveal>
          )}

          {/* Transfer tx (from release) */}
          {releaseResult?.transfer_tx && (
            <ScrollReveal delay={0.1}>
              <SolanaHash label="Release — Transfer Proof" txHash={releaseResult.transfer_tx} network="devnet" />
            </ScrollReveal>
          )}

          <ScrollReveal delay={0.5}>
            <DeadManSwitch />
          </ScrollReveal>

          {/* Demo release section */}
          {sealResult?.package_id && !releaseResult && (
            <ScrollReveal delay={0.6}>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Send className="h-4 w-4 text-amber" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Demo: Release Package
                  </span>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  In production, the package releases automatically when the dead man&#39;s switch
                  expires (no check-in for 30 days). For the demo, you can trigger it manually.
                  {recipientEmail && (
                    <span className="block mt-1 text-amber">
                      Will be delivered to: {recipientEmail}
                    </span>
                  )}
                </p>
                <button
                  onClick={handleDemoRelease}
                  disabled={isReleasing}
                  className="flex items-center gap-2 rounded-full bg-amber px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReleasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Releasing to Solana...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Release Package Now (Demo)
                    </>
                  )}
                </button>
                {releaseError && (
                  <p className="mt-2 text-sm text-danger">{releaseError}</p>
                )}
              </div>
            </ScrollReveal>
          )}

          {/* Release confirmation */}
          {releaseResult && (
            <ScrollReveal delay={0.1}>
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold text-green-500">
                    Package Released
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The package has been released to{" "}
                  <span className="font-medium text-foreground">
                    {releaseResult.recipient_name || recipientEmail || "the recipient"}
                  </span>
                  . Both the seal and release are now permanently recorded on Solana.
                </p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  )
}
