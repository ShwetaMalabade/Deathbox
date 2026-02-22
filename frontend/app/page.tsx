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
import { DeathBoxProvider } from "@/context/deathbox-context"

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

      {/* Screen 6 - Package Sealed */}
      <div id="security">
        <PackageSealedSection />
      </div>

      <SectionDivider />

      {/* Screen 7 - Family Intro (Emotional Transition) */}
      <div id="family">
        <FamilyIntroSection />
      </div>

      <SectionDivider />

      {/* Screen 8 - Family Package View */}
      <FamilyPackageSection />

      <SectionDivider />

      {/* Screen 9 - Voice Player */}
      <VoicePlayerSection />

      {/* Footer CTA */}
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
