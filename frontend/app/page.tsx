"use client"

import { Navbar } from "@/components/deathbox/navbar"
import { Particles } from "@/components/deathbox/particles"
import { HeroSection } from "@/components/deathbox/hero-section"
import { SetupSection } from "@/components/deathbox/setup-section"
import { VoiceRecordingSection } from "@/components/deathbox/voice-recording-section"
import { AIProcessingSection } from "@/components/deathbox/ai-processing-section"
import { BenefitsChecklistSection } from "@/components/deathbox/benefits-checklist-section"
import { PackageSealedSection } from "@/components/deathbox/package-sealed-section"
import { FamilyIntroSection } from "@/components/deathbox/family-intro-section"
import { FamilyPackageSection } from "@/components/deathbox/family-package-section"
import { VoicePlayerSection } from "@/components/deathbox/voice-player-section"
import { SectionDivider } from "@/components/deathbox/section-divider"
import { DeathBoxProvider, useDeathBox } from "@/context/deathbox-context"
import { ScrollReveal } from "@/components/deathbox/scroll-reveal"
import { Send, Loader2, Shield, ExternalLink, CheckCircle2 } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

function SolanaTransferHash({ txHash }: { txHash: string }) {
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

  const explorerUrl = `https://explorer.solana.com/tx/${txHash}?cluster=devnet`

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Release — Transfer Proof
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

function FamilySections() {
  const {
    isSettingsSaved, isReleased, isReleasing, releaseError,
    releasePackage, releaseResult, recipientName, checkinDays,
  } = useDeathBox()

  if (!isSettingsSaved) return null

  return (
    <>
      <SectionDivider />

      <section className="relative px-6 py-32 md:py-40">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal>
            <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
              Family View
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
              {isReleased ? "Package delivered" : "Preview the delivery"}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mx-auto mb-12 max-w-xl text-center text-lg text-muted-foreground">
              {isReleased
                ? `The package has been released to ${recipientName}. Here's what they received.`
                : `In production, this releases automatically after ${checkinDays} days of inactivity. For the demo, you can trigger it now.`}
            </p>
          </ScrollReveal>

          {!isReleased && (
            <ScrollReveal delay={0.3}>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => releasePackage()}
                  disabled={isReleasing}
                  className="flex items-center gap-2 rounded-full bg-amber px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed glow-amber-sm"
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
                  <p className="text-sm text-danger">{releaseError}</p>
                )}
              </div>
            </ScrollReveal>
          )}

          {isReleased && (
            <div className="flex flex-col gap-4">
              {releaseResult?.transfer_tx && (
                <ScrollReveal delay={0.1}>
                  <SolanaTransferHash txHash={releaseResult.transfer_tx} />
                </ScrollReveal>
              )}
              <ScrollReveal delay={0.2}>
                <div className="rounded-xl border border-success/30 bg-success/5 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-sm font-semibold text-success">Package Released</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The package has been released to{" "}
                    <span className="font-medium text-foreground">{recipientName}</span>.
                    Both the seal and release are permanently recorded on Solana.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          )}
        </div>
      </section>

      {isReleased && (
        <>
          <SectionDivider />
          <div id="family">
            <FamilyIntroSection />
          </div>
          <SectionDivider />
          <FamilyPackageSection />
          <SectionDivider />
          <VoicePlayerSection />
        </>
      )}
    </>
  )
}

export default function DeathBoxPage() {
  return (
    <DeathBoxProvider>
    <main className="relative min-h-screen bg-background">
      <Particles />
      <Navbar />

      {/* Screen 1 - Cinematic Hero */}
      <HeroSection />

      <SectionDivider />

      {/* Screen 2 - Setup */}
      <div id="how-it-works">
        <SetupSection />
      </div>

      <SectionDivider />

      {/* Screen 3 - Voice Recording */}
      <VoiceRecordingSection />

      <SectionDivider />

      {/* Screen 4 - AI Processing */}
      <AIProcessingSection />

      <SectionDivider />

      {/* Screen 5 - Benefits Checklist */}
      <BenefitsChecklistSection />

      <SectionDivider />

      {/* Screen 6 - Package Sealed + Settings */}
      <div id="security">
        <PackageSealedSection />
      </div>

      {/* Screens 7-9: Family View (after settings saved + demo release) */}
      <FamilySections />

      {/* Footer */}
      <footer className="relative z-10 px-6 py-32 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-amber">
          Protect what matters
        </p>
        <h2 className="mb-6 text-4xl font-bold text-foreground md:text-5xl text-balance">
          Start organizing today
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-lg text-muted-foreground">
          Give your family the gift of clarity. It takes 15 minutes to set up
          and could save them months of confusion.
        </p>
        <button className="glow-amber rounded-full bg-amber px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:brightness-110">
          Get Early Access
        </button>
        <p className="mt-16 text-sm text-muted-foreground">
          Built with care. Your data is encrypted and never shared.
        </p>
      </footer>
    </main>
    </DeathBoxProvider>
  )
}
