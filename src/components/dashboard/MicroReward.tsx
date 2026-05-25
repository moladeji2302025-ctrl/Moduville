'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export type MicroRewardKind = 'rare-elixir' | 'dragon-stir' | 'spirit'

const REWARDS: Record<MicroRewardKind, { symbol: string; title: string; subtitle: string; color: string }> = {
  'rare-elixir': {
    symbol:   '✦',
    title:    'Rare Elixir Drop',
    subtitle: 'A golden surge flows into the tank.',
    color:    '#d4a853',
  },
  'dragon-stir': {
    symbol:   '◈',
    title:    "Dragon's Approval",
    subtitle: 'The egg pulses — it felt that.',
    color:    '#e05c2f',
  },
  'spirit': {
    symbol:   '❋',
    title:    'Spirit Sighting',
    subtitle: 'Something ancient stirs nearby.',
    color:    '#7c6fff',
  },
}

/** Returns a random kind — call this before rendering MicroReward */
export function pickMicroReward(): MicroRewardKind {
  const kinds = Object.keys(REWARDS) as MicroRewardKind[]
  return kinds[Math.floor(Math.random() * kinds.length)]
}

interface Props {
  kind: MicroRewardKind
  onDone: () => void
}

export function MicroReward({ kind, onDone }: Props) {
  const reward = REWARDS[kind]

  // Auto-dismiss after 2.4 s
  useEffect(() => {
    const id = setTimeout(onDone, 2400)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{    opacity: 0, y: -16, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-24 inset-x-0 flex justify-center z-50 pointer-events-none"
    >
      <div
        className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-sm"
        style={{
          background:   `${reward.color}12`,
          borderColor:  `${reward.color}35`,
        }}
      >
        {/* Symbol */}
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xl leading-none"
          style={{ color: reward.color }}
        >
          {reward.symbol}
        </motion.span>

        <div>
          <p className="text-text text-sm font-display tracking-wide">{reward.title}</p>
          <p className="text-muted text-xs mt-0.5">{reward.subtitle}</p>
        </div>
      </div>
    </motion.div>
  )
}
