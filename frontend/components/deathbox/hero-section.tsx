"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Glowing Orb */}
      <motion.div
        className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full md:h-[500px] md:w-[500px]"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.12 75 / 0.25) 0%, oklch(0.78 0.12 75 / 0.08) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />

      {/* Inner orb core */}
      <motion.div
        className="absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full md:h-40 md:w-40"
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.1 80 / 0.5) 0%, oklch(0.78 0.12 75 / 0.2) 50%, transparent 80%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.p
          className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Organize Life. Protect Family.
        </motion.p>

        <motion.h1
          className="text-gradient-amber mb-6 text-6xl font-bold tracking-tight md:text-8xl lg:text-9xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          DeathBox
        </motion.h1>

        <motion.p
          className="mb-10 max-w-lg text-lg text-muted-foreground md:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          Everything your family needs to know, organized while you are here,
          delivered when it matters most.
        </motion.p>

        <motion.button
          className="glow-amber-sm rounded-full bg-amber px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>

        {/* Sponsor logos */}
        <motion.div
          className="mt-20 flex items-center gap-8 opacity-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 1.5, delay: 1.8 }}
        >
          <span className="text-xs font-medium uppercase tracking-widest text-foreground">
            Trusted by
          </span>
          <div className="flex items-center gap-6">
            {["ADP", "Fidelity", "Vanguard", "MetLife"].map((name) => (
              <span
                key={name}
                className="font-mono text-xs tracking-wider text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-6 w-6 text-amber opacity-50" />
      </motion.div>
    </section>
  )
}
