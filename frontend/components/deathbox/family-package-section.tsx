"use client"

import { motion, useInView } from "framer-motion"
import {
  AlertTriangle,
  Clock,
  DollarSign,
  CreditCard,
  XCircle,
} from "lucide-react"
import { useRef } from "react"
import { ScrollReveal } from "./scroll-reveal"

type Urgency = "red" | "yellow" | "green" | "gray"

interface PackageItem {
  urgency: Urgency
  title: string
  detail: string
  deadline?: string
}

const urgencyConfig = {
  red: {
    icon: AlertTriangle,
    label: "Urgent Deadline",
    bgClass: "bg-danger/8 border-danger/20",
    textClass: "text-danger",
    badgeClass: "bg-danger/15 text-danger",
  },
  yellow: {
    icon: DollarSign,
    label: "Money Owed",
    bgClass: "bg-warning/8 border-warning/20",
    textClass: "text-warning",
    badgeClass: "bg-warning/15 text-warning",
  },
  green: {
    icon: CreditCard,
    label: "Debt Clarification",
    bgClass: "bg-success/8 border-success/20",
    textClass: "text-success",
    badgeClass: "bg-success/15 text-success",
  },
  gray: {
    icon: XCircle,
    label: "Cancel",
    bgClass: "bg-muted/50 border-border",
    textClass: "text-muted-foreground",
    badgeClass: "bg-muted text-muted-foreground",
  },
}

const packageItems: PackageItem[] = [
  {
    urgency: "red",
    title: "COBRA Health Insurance",
    detail: "Elect within 60 days to continue health coverage for the family.",
    deadline: "60 days",
  },
  {
    urgency: "red",
    title: "Life Insurance Claim",
    detail: "File claim with MetLife. Policy #LF-4829371. Coverage: $500,000.",
    deadline: "90 days",
  },
  {
    urgency: "red",
    title: "AD&D Insurance Claim",
    detail: "Check employer benefits portal for accidental death coverage.",
    deadline: "30 days",
  },
  {
    urgency: "yellow",
    title: "401(k) Distribution",
    detail: "Contact Fidelity to initiate beneficiary distribution. Balance: $142,300.",
  },
  {
    urgency: "yellow",
    title: "HSA Funds",
    detail: "Transfer HSA balance from Optum. Available: $8,200.",
  },
  {
    urgency: "yellow",
    title: "Final Paycheck & PTO",
    detail: "Contact HR for final paycheck and unused PTO payout.",
  },
  {
    urgency: "green",
    title: "Car Loan - Chase Auto",
    detail: "Remaining balance: $12,000. Contact for payoff or transfer options.",
  },
  {
    urgency: "green",
    title: "Mortgage - Wells Fargo",
    detail: "Remaining: $285,000. Check mortgage protection insurance.",
  },
  {
    urgency: "green",
    title: "Student Loans - Federal",
    detail: "Balance: $34,500. Federal loans discharged upon death with certificate.",
  },
  {
    urgency: "gray",
    title: "Netflix, Spotify, Adobe",
    detail: "Cancel monthly subscriptions. Approx $45/month total.",
  },
  {
    urgency: "gray",
    title: "Gym Membership",
    detail: "Cancel Planet Fitness membership. $22/month.",
  },
]

function PackageCard({ item, index }: { item: PackageItem; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-30px" })
  const config = urgencyConfig[item.urgency]
  const Icon = config.icon

  return (
    <motion.div
      ref={ref}
      className={`rounded-xl border p-5 ${config.bgClass}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.badgeClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-foreground">{item.title}</h4>
            {item.deadline && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.badgeClass}`}>
                <Clock className="h-3 w-3" />
                {item.deadline}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
        </div>
      </div>
    </motion.div>
  )
}

export function FamilyPackageSection() {
  const sections = [
    { urgency: "red" as Urgency, title: "Urgent Deadlines", items: packageItems.filter((i) => i.urgency === "red") },
    { urgency: "yellow" as Urgency, title: "Money & Benefits", items: packageItems.filter((i) => i.urgency === "yellow") },
    { urgency: "green" as Urgency, title: "Debts & Obligations", items: packageItems.filter((i) => i.urgency === "green") },
    { urgency: "gray" as Urgency, title: "Subscriptions to Cancel", items: packageItems.filter((i) => i.urgency === "gray") },
  ]

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            {"Sarah's Package"}
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            Everything organized by priority
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-16 max-w-xl text-center text-lg text-muted-foreground">
            Color-coded by urgency so your family knows exactly what to do
            first, with clear instructions for every item.
          </p>
        </ScrollReveal>

        <div className="flex flex-col gap-10">
          {sections.map((section) => (
            <div key={section.urgency}>
              <ScrollReveal>
                <h3
                  className={`mb-4 text-sm font-semibold uppercase tracking-wider ${urgencyConfig[section.urgency].textClass}`}
                >
                  {section.title}
                </h3>
              </ScrollReveal>
              <div className="flex flex-col gap-3">
                {section.items.map((item, i) => (
                  <PackageCard key={item.title} item={item} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
