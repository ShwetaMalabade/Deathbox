"use client"

import { motion } from "framer-motion"

export function Navbar() {
  return (
    <motion.header
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-6 py-5 md:px-10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15">
          <div className="h-3 w-3 rounded-sm bg-amber" />
        </div>
        <span className="text-sm font-bold tracking-wide text-foreground">
          DeathBox
        </span>
      </div>

      <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
        <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          How it Works
        </a>
        <a href="#security" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Security
        </a>
        <a href="#family" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          For Family
        </a>
      </nav>

      <a
        href="#how-it-works"
        className="rounded-full border border-amber/30 bg-amber/10 px-5 py-2 text-sm font-medium text-amber transition-colors hover:bg-amber/20"
      >
        Get Started
      </a>
    </motion.header>
  )
}
