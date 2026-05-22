'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

interface Props {
  onContinue: () => void
}

const lines = [
  { text: "Moduville doesn't ask you to pick one goal.", delay: 0.3 },
  { text: "It builds all of you — one day at a time.", delay: 0.65 },
]

export function StepWelcome({ onContinue }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="font-display text-gold text-xs tracking-[0.45em] uppercase mb-12"
      >
        MODUVILLE
      </motion.p>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.1 }}
        className="font-display text-4xl sm:text-5xl md:text-6xl text-text mb-8 leading-tight"
      >
        Let&apos;s build your life.
      </motion.h1>

      {/* Description lines */}
      <div className="mb-14 space-y-2 max-w-sm">
        {lines.map(({ text, delay }) => (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay }}
            className="text-muted text-base leading-relaxed"
          >
            {text}
          </motion.p>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-gold/10 border border-gold/30 text-text rounded-xl hover:bg-gold/18 hover:border-gold/55 transition-all duration-300 font-body text-base"
        >
          <span>I&apos;m Ready</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </motion.button>
      </motion.div>
    </div>
  )
}
