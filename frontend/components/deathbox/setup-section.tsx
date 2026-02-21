"use client"

import { motion } from "framer-motion"
import {
  Briefcase,
  CreditCard,
  Shield,
  Users,
} from "lucide-react"
import { ScrollReveal, StaggerContainer, StaggerItem } from "./scroll-reveal"

const setupCards = [
  {
    icon: Briefcase,
    title: "Job Benefits",
    description: "401k, HSA, life insurance, AD&D, PTO balances, and employer benefits.",
  },
  {
    icon: CreditCard,
    title: "Accounts & Debts",
    description: "Bank accounts, investments, credit cards, loans, and outstanding balances.",
  },
  {
    icon: Shield,
    title: "Insurance",
    description: "Health, life, auto, home, and any supplemental coverage details.",
  },
  {
    icon: Users,
    title: "Recipients",
    description: "Designate who receives your package and how they will be notified.",
  },
]

export function SetupSection() {
  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            Step 1
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            Tell us about your life
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-muted-foreground">
            We guide you through everything that matters. No forms, no
            spreadsheets. Just a simple conversation.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid gap-6 md:grid-cols-2">
          {setupCards.map((card) => (
            <StaggerItem key={card.title}>
              <motion.div
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-colors hover:border-amber/30"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber/10">
                    <card.icon className="h-6 w-6 text-amber" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground">{card.description}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
