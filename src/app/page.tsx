'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const ELIXIR_DOTS = [
  { x: '12%', y: '18%', color: '#d4a853', size: 2, delay: 0 },
  { x: '88%', y: '22%', color: '#e05c2f', size: 1.5, delay: 0.8 },
  { x: '5%', y: '65%', color: '#7c6fff', size: 2, delay: 1.4 },
  { x: '92%', y: '70%', color: '#3dbd7a', size: 1.5, delay: 0.3 },
  { x: '20%', y: '88%', color: '#4a7fff', size: 2, delay: 1.1 },
  { x: '75%', y: '12%', color: '#d4a853', size: 1, delay: 0.6 },
  { x: '45%', y: '8%', color: '#c4c9e8', size: 1.5, delay: 1.7 },
  { x: '82%', y: '90%', color: '#7c6fff', size: 2, delay: 0.9 },
  { x: '30%', y: '75%', color: '#e05c2f', size: 1, delay: 1.3 },
  { x: '60%', y: '93%', color: '#d4a853', size: 1.5, delay: 0.2 },
]

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-void">
      {/* Atmospheric gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 20% 80%, #0d0a2a 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 85% 15%, #0a0d25 0%, transparent 55%)',
        }}
      />

      {/* Floating elixir dots */}
      {ELIXIR_DOTS.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size * 2,
            height: dot.size * 2,
            background: dot.color,
            boxShadow: `0 0 ${dot.size * 4}px ${dot.color}`,
          }}
          animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.3, 1] }}
          transition={{
            duration: 4 + i * 0.3,
            repeat: Infinity,
            delay: dot.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Wordmark */}
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display text-gold text-xs tracking-[0.45em] uppercase mb-10"
        >
          MODUVILLE
        </motion.p>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-10"
        >
          <motion.h1
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="font-display text-4xl sm:text-6xl md:text-7xl leading-tight text-text"
          >
            Build the life you keep
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.58 }}
            className="font-display text-4xl sm:text-6xl md:text-7xl leading-tight text-gold"
          >
            promising yourself.
          </motion.h1>
        </motion.div>

        {/* Separator + description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mb-12"
        >
          <div className="w-20 h-px bg-gold mx-auto mb-8 opacity-40" />
          <p className="text-muted text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
            Every goal you carry; health, faith, business, creativity; deserves a daily structure built around it.
            One routine. One direction. One you.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.35 }}
        >
          <Link href="/onboarding">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-ember/10 border border-ember/35 text-text rounded-xl hover:bg-ember/20 hover:border-ember/65 transition-all duration-300 font-body text-base"
            >
              <span>Begin Your Journey</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Version badge */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted/35 text-xs font-body tracking-widest">
        v0.1 · In Development
      </p>
    </main>
  )
}
