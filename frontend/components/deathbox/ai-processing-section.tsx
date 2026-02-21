"use client"

import { motion, useInView } from "framer-motion"
import { Brain, FileSearch, Building2, AlertCircle, Package } from "lucide-react"
import { useRef } from "react"
import { ScrollReveal } from "./scroll-reveal"

const processingSteps = [
  {
    icon: FileSearch,
    label: "Parsing transcript",
    detail: "Analyzing speech patterns and extracting financial data...",
  },
  {
    icon: Building2,
    label: "Extracting accounts",
    detail: "Identifying bank accounts, investments, and debts...",
  },
  {
    icon: Building2,
    label: "Cross-referencing ADP benefits",
    detail: "Matching employer benefits with recorded information...",
  },
  {
    icon: AlertCircle,
    label: "Detecting missing info",
    detail: "Scanning for gaps in coverage and undisclosed accounts...",
  },
  {
    icon: Package,
    label: "Building package",
    detail: "Compiling comprehensive family protection package...",
  },
]

function AIBrain() {
  return (
    <div className="relative mx-auto mb-14 flex h-40 w-40 items-center justify-center">
      {/* Rotating rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-amber/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-3 rounded-full border border-amber/15"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-6 rounded-full border border-amber/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Orbital dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-amber"
          style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4 }}
          animate={{
            x: [
              Math.cos((i * Math.PI) / 3) * 60,
              Math.cos((i * Math.PI) / 3 + Math.PI) * 60,
              Math.cos((i * Math.PI) / 3) * 60,
            ],
            y: [
              Math.sin((i * Math.PI) / 3) * 60,
              Math.sin((i * Math.PI) / 3 + Math.PI) * 60,
              Math.sin((i * Math.PI) / 3) * 60,
            ],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Core glow */}
      <motion.div
        className="absolute h-16 w-16 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.78 0.12 75 / 0.4) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <Brain className="relative z-10 h-10 w-10 text-amber" />
    </div>
  )
}

function ProcessingStep({
  step,
  index,
}: {
  step: (typeof processingSteps)[0]
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <motion.div
      ref={ref}
      className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors"
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.3 }}
    >
      <motion.div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        initial={{ backgroundColor: "oklch(0.22 0.015 250)" }}
        animate={
          isInView
            ? { backgroundColor: "oklch(0.78 0.12 75 / 0.15)" }
            : {}
        }
        transition={{ duration: 0.4, delay: index * 0.3 + 0.3 }}
      >
        <step.icon className="h-5 w-5 text-amber" />
      </motion.div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-foreground">{step.label}</h4>
          <motion.div
            className="h-2 w-2 rounded-full bg-success"
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: index * 0.3 + 0.5 }}
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
      </div>
    </motion.div>
  )
}

export function AIProcessingSection() {
  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.25em] text-amber">
            Step 3
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="mb-4 text-center text-4xl font-bold text-foreground md:text-5xl text-balance">
            AI does the heavy lifting
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mx-auto mb-16 max-w-xl text-center text-lg text-muted-foreground">
            Our AI analyzes your recording, extracts every detail, and builds a
            complete protection package for your family.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <AIBrain />
        </ScrollReveal>

        <div className="flex flex-col gap-4">
          {processingSteps.map((step, i) => (
            <ProcessingStep key={step.label} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
