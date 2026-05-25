'use client'

import { motion } from 'framer-motion'
import { DragonEgg } from '@/components/dragon/DragonEgg'
import type { RoutineBlock, ElixirType } from '@/lib/types'

const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire:      '#e05c2f',
  celestial: '#d4a853',
  iron:      '#8a9bb5',
  storm:     '#7c6fff',
  wisdom:    '#4a7fff',
  bloom:     '#3dbd7a',
  moon:      '#c4c9e8',
}

const ELIXIR_NAMES: Record<ElixirType, string> = {
  fire:      'Fire Elixir',
  celestial: 'Celestial Elixir',
  iron:      'Iron Elixir',
  storm:     'Storm Elixir',
  wisdom:    'Wisdom Elixir',
  bloom:     'Bloom Elixir',
  moon:      'Moon Elixir',
}

interface Props {
  completedBlocks: RoutineBlock[]
  totalGoalBlocks: number
  warmth: number
  tomorrowFirstBlock: RoutineBlock | null
  onClose: () => void
}

function getMessage(rate: number): string {
  if (rate >= 0.9) return 'A full day of Elixir. The dragon feels it. So do you.'
  if (rate >= 0.7) return 'Solid. You showed up for what mattered. The egg grows warmer.'
  if (rate >= 0.4) return 'More than nothing — and that\'s never nothing. Rest and return.'
  if (rate >  0)   return 'The city was quiet today. One block still lit a flame.'
  return 'Rest well. The egg waits. Tomorrow the doors open again.'
}

export function WindDownRitual({
  completedBlocks,
  totalGoalBlocks,
  warmth,
  tomorrowFirstBlock,
  onClose,
}: Props) {
  const rate = totalGoalBlocks > 0 ? completedBlocks.length / totalGoalBlocks : 0

  // Unique elixirs collected today
  const elixirs = completedBlocks.reduce<ElixirType[]>((acc, b) => {
    if (b.elixirType && !acc.includes(b.elixirType)) acc.push(b.elixirType)
    return acc
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-void flex flex-col items-center justify-between px-5 py-10 overflow-y-auto"
    >
      {/* Atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 65% at 50% 35%, #0f0a28 0%, #070714 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center gap-7">

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-gold text-xs tracking-[0.45em] uppercase"
        >
          Wind Down
        </motion.p>

        {/* Dragon */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <DragonEgg size={150} warmth={warmth} float />
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-center"
        >
          <p className="text-text text-2xl font-display mb-1">
            {completedBlocks.length}
            <span className="text-muted text-base"> / {totalGoalBlocks}</span>
          </p>
          <p className="text-muted text-xs mb-4">goal blocks completed</p>
          <p className="text-text/75 text-sm leading-relaxed max-w-xs">
            {getMessage(rate)}
          </p>
        </motion.div>

        {/* Elixirs collected */}
        {elixirs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {elixirs.map(e => (
              <span
                key={e}
                className="px-3 py-1 rounded-full text-xs font-body border"
                style={{
                  color:            ELIXIR_COLORS[e],
                  borderColor:      `${ELIXIR_COLORS[e]}38`,
                  backgroundColor:  `${ELIXIR_COLORS[e]}10`,
                }}
              >
                {ELIXIR_NAMES[e]}
              </span>
            ))}
          </motion.div>
        )}

        {/* Tomorrow preview */}
        {tomorrowFirstBlock && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="w-full border border-border/50 rounded-xl p-4 bg-surface/25"
          >
            <p className="text-muted/70 text-xs mb-2 font-body">Tomorrow begins with</p>
            <p className="text-text font-display text-sm">{tomorrowFirstBlock.name}</p>
            <p className="text-muted text-xs mt-0.5">
              {tomorrowFirstBlock.time} · {tomorrowFirstBlock.duration} min
            </p>
          </motion.div>
        )}
      </div>

      {/* Rest button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClose}
        className="relative z-10 mt-8 px-10 py-4 font-display text-sm tracking-[0.25em] uppercase text-gold border border-gold/28 rounded-xl hover:bg-gold/10 transition-all"
      >
        Rest Well
      </motion.button>
    </motion.div>
  )
}
