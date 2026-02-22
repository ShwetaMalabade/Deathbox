"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { useDeathBox } from "@/context/deathbox-context"

export function FamilyIntroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const { recipientName } = useDeathBox()

  const displayName = recipientName || "your family"

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.78 0.12 75 / 0.06) 0%, transparent 60%)",
        }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 3 }}
      />

      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, delay: 0.3 }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          className="text-amber opacity-60"
          aria-hidden="true"
        >
          <path
            d="M40 15C35 20 20 30 20 45C20 55 28 65 40 65C52 65 60 55 60 45C60 30 45 20 40 15Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M40 35V55"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M32 43H48"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </motion.div>

      <motion.p
        className="mb-6 text-sm font-medium uppercase tracking-[0.3em] text-amber"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.8 }}
      >
        30 days later
      </motion.p>

      <motion.h2
        className="mb-4 text-center text-4xl font-bold text-foreground md:text-6xl text-balance"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 1.2 }}
      >
        No check-in received.
      </motion.h2>

      <motion.div
        className="my-8 h-px w-24 bg-amber/30"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1, delay: 1.8 }}
      />

      <motion.p
        className="max-w-md text-center text-lg text-muted-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 2.2 }}
      >
        Your package has been delivered to{" "}
        <span className="font-semibold text-amber">{displayName}</span>.
      </motion.p>

      <motion.p
        className="mt-2 max-w-md text-center text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.7 } : {}}
        transition={{ duration: 1, delay: 2.8 }}
      >
        They now have everything they need.
      </motion.p>
    </section>
  )
}
