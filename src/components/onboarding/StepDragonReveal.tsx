'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragonEgg } from '@/components/dragon/DragonEgg'

const REVEAL_LINES = [
  { text: 'Your dragon egg has been placed.', delay: 1.0 },
  { text: 'Cold. Waiting. Yours.', delay: 1.7, gold: true },
  { text: 'Every block you complete will warm it.', delay: 2.6 },
  { text: 'Every day you show up will change it.', delay: 3.2 },
]

export function StepDragonReveal() {
  const [showButton, setShowButton] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Deep background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, #0f0a25 0%, #070714 65%)',
        }}
      />

      {/* Egg entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mb-12"
        onAnimationComplete={() => setTimeout(() => setShowButton(true), 3600)}
      >
        <DragonEgg size={200} glowColor="#d4a853" warmth={0.05} float />
      </motion.div>

      {/* Text lines */}
      <div className="relative z-10 text-center space-y-3 mb-14 max-w-xs">
        {REVEAL_LINES.map(({ text, delay, gold }) => (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: 'easeOut' }}
            className={`font-display text-sm sm:text-base leading-relaxed tracking-wide ${
              gold ? 'text-gold' : 'text-text/80'
            }`}
          >
            {text}
          </motion.p>
        ))}
      </div>

      {/* Enter button */}
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => alert('Main app coming next — the journey begins here.')}
              className="px-10 py-4 bg-gold/10 border border-gold/35 text-gold font-display text-sm tracking-[0.2em] rounded-xl hover:bg-gold/18 hover:border-gold/60 transition-all duration-300 uppercase"
            >
              Enter Moduville
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
