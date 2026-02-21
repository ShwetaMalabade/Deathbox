"use client"

import { motion } from "framer-motion"

export function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-8">
      <motion.div
        className="h-px w-32 bg-gradient-to-r from-transparent via-amber/30 to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
      />
    </div>
  )
}
