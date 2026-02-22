"use client"

import { motion, useInView } from "framer-motion"
import { Brain, FileSearch, Building2, AlertCircle, Package, Check, Loader2 } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { ScrollReveal } from "./scroll-reveal"
import { useDeathBox } from "@/context/deathbox-context"

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

type StepStatus = "pending" | "active" | "done"

function AIBrain({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative mx-auto mb-14 flex h-40 w-40 items-center justify-center">
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
            opacity: isActive ? [0.3, 0.8, 0.3] : 0.15,
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="absolute h-16 w-16 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.78 0.12 75 / 0.4) 0%, transparent 70%)",
        }}
        animate={
          isActive
            ? { scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }
            : { scale: 1, opacity: 0.3 }
        }
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <Brain className="relative z-10 h-10 w-10 text-amber" />
    </div>
  )
}

function ProcessingStep({
  step,
  index,
  status,
}: {
  step: (typeof processingSteps)[0]
  index: number
  status: StepStatus
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const isActive = status === "active"
  const isDone = status === "done"

  return (
    <motion.div
      ref={ref}
      className={`flex items-start gap-4 rounded-xl border p-5 transition-all duration-500 ${
        isActive
          ? "border-amber/40 bg-card shadow-lg shadow-amber/5"
          : isDone
          ? "border-border bg-card"
          : "border-border bg-card"
      }`}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.3 }}
    >
      <motion.div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-500 ${
          isDone
            ? "bg-success/15"
            : isActive
            ? "bg-amber/15"
            : "bg-secondary"
        }`}
      >
        <step.icon className={`h-5 w-5 ${isDone ? "text-success" : "text-amber"}`} />
      </motion.div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-foreground">{step.label}</h4>
          {isDone && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success">
              <Check className="h-3 w-3 text-white" />
            </span>
          )}
          {isActive && (
            <Loader2 className="h-4 w-4 animate-spin text-amber" />
          )}
          {!isActive && !isDone && (
            <motion.div
              className="h-2 w-2 rounded-full bg-success"
              initial={{ scale: 0, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: index * 0.3 + 0.5 }}
            />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
      </div>
    </motion.div>
  )
}

export function AIProcessingSection() {
  const { isTranscribing, isAnalyzing, analysisResult } = useDeathBox()

  const isProcessing = isTranscribing || isAnalyzing
  const isDone = !!analysisResult

  // Animated step statuses when actually processing
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    processingSteps.map(() => "pending")
  )
  const animatingRef = useRef(false)

  useEffect(() => {
    if (!isProcessing || animatingRef.current) return
    animatingRef.current = true

    let cancelled = false
    async function animateSteps() {
      for (let i = 0; i < processingSteps.length; i++) {
        if (cancelled) break
        setStepStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? "active" : idx < i ? "done" : s))
        )
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800))
        if (cancelled) break
        setStepStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? "done" : s))
        )
      }
    }
    animateSteps()
    return () => {
      cancelled = true
    }
  }, [isProcessing])

  // When analysis completes, mark all done
  useEffect(() => {
    if (isDone) {
      setStepStatuses(processingSteps.map(() => "done"))
      animatingRef.current = false
    }
  }, [isDone])

  // Reset when nothing has happened yet
  useEffect(() => {
    if (!isProcessing && !isDone) {
      setStepStatuses(processingSteps.map(() => "pending"))
      animatingRef.current = false
    }
  }, [isProcessing, isDone])

  return (
    <section id="ai-processing" className="relative px-6 py-32 md:py-40">
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
          <AIBrain isActive={isProcessing} />
        </ScrollReveal>

        {/* Progress bar — only visible when processing */}
        {(isProcessing || isDone) && (
          <div className="mb-8">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>{isProcessing ? "Processing..." : "Complete"}</span>
              <span>
                {Math.round(
                  (stepStatuses.filter((s) => s === "done").length /
                    processingSteps.length) *
                    100
                )}
                %
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-amber transition-all duration-700 ease-out"
                style={{
                  width: `${
                    (stepStatuses.filter((s) => s === "done").length /
                      processingSteps.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {processingSteps.map((step, i) => (
            <ProcessingStep
              key={step.label}
              step={step}
              index={i}
              status={stepStatuses[i]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
