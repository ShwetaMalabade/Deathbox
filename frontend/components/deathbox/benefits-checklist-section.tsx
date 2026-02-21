"use client"

import { motion, useInView } from "framer-motion"
import { Check, AlertTriangle, X } from "lucide-react"
import { useRef } from "react"
import { ScrollReveal } from "./scroll-reveal"

type BenefitStatus = "found" | "missing" | "unknown"

interface BenefitItem {
  name: string
  status: BenefitStatus
  detail: string
}

const benefits: BenefitItem[] = [
  { name: "401(k) Retirement", status: "found", detail: "Fidelity - $142,300 balance" },
  { name: "HSA Account", status: "found", detail: "Optum - $8,200 balance" },
  { name: "Car Loan", status: "found", detail: "Chase Auto - $12,000 remaining" },
  { name: "Life Insurance", status: "unknown", detail: "MetLife - Amount unconfirmed" },
  { name: "Health Insurance", status: "found", detail: "BCBS PPO - Family plan" },
  { name: "PTO Balance", status: "missing", detail: "Not mentioned in recording" },
  { name: "AD&D Insurance", status: "missing", detail: "No coverage data found" },
  { name: "Mortgage", status: "found", detail: "Wells Fargo - $285,000 remaining" },
  { name: "Student Loans", status: "found", detail: "Federal - $34,500 remaining" },
  { name: "Disability Insurance", status: "unknown", detail: "Employer benefit - unverified" },
]

function StatusIcon({ status }: { status: BenefitStatus }) {
  if (status === "found") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/15">
        <Check className="h-4 w-4 text-success" />
      </div>
    )
  }
  if (status === "unknown") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/15">
        <AlertTriangle className="h-4 w-4 text-warning" />
      </div>
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/15">
      <X className="h-4 w-4 text-danger" />
    </div>
  )
}

function BenefitRow({ item, index }: { item: BenefitItem; index: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-30px" })

  return (
    <motion.div
      ref={ref}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-amber/20"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      <StatusIcon status={item.status} />
      <div className="flex-1">
        <h4 className="font-medium text-foreground">{item.name}</h4>
        <p className="text-sm text-muted-foreground">{item.detail}</p>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          item.status === "found"
            ? "bg-success/10 text-success"
            : item.status === "unknown"
              ? "bg-warning/10 text-warning"
              : "bg-danger/10 text-danger"
        }`}
      >
        {item.status === "found"
          ? "Found"
          : item.status === "unknown"
            ? "Unverified"
            : "Missing"}
      </span>
    </motion.div>
  )
}

export function BenefitsChecklistSection() {
  const foundCount = benefits.filter((b) => b.status === "found").length
  const missingCount = benefits.filter((b) => b.status === "missing").length
  const unknownCount = benefits.filter((b) => b.status === "unknown").length

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            Step 4
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            Your benefits, verified
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-10 max-w-xl text-center text-lg text-muted-foreground">
            We cross-reference everything you mentioned with your employer
            benefits and flag anything that is missing or needs attention.
          </p>
        </ScrollReveal>

        {/* Summary cards */}
        <ScrollReveal delay={0.3}>
          <div className="mb-10 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 text-center">
              <p className="text-3xl font-bold text-success">{foundCount}</p>
              <p className="text-sm text-muted-foreground">Found</p>
            </div>
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-center">
              <p className="text-3xl font-bold text-warning">{unknownCount}</p>
              <p className="text-sm text-muted-foreground">Unverified</p>
            </div>
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
              <p className="text-3xl font-bold text-danger">{missingCount}</p>
              <p className="text-sm text-muted-foreground">Missing</p>
            </div>
          </div>
        </ScrollReveal>

        {/* Benefits list */}
        <div className="flex flex-col gap-3">
          {benefits.map((item, i) => (
            <BenefitRow key={item.name} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
