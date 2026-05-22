'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { GeneratedRoutine, DayOfWeek, ElixirType, BlockType } from '@/lib/types'

interface Props {
  routine: GeneratedRoutine
  onContinue: () => void
}

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'mon', label: 'Monday',    short: 'MON' },
  { key: 'tue', label: 'Tuesday',   short: 'TUE' },
  { key: 'wed', label: 'Wednesday', short: 'WED' },
  { key: 'thu', label: 'Thursday',  short: 'THU' },
  { key: 'fri', label: 'Friday',    short: 'FRI' },
  { key: 'sat', label: 'Saturday',  short: 'SAT' },
  { key: 'sun', label: 'Sunday',    short: 'SUN' },
]

const ELIXIR_DOT: Record<ElixirType, string> = {
  fire:      'bg-ember',
  celestial: 'bg-gold',
  iron:      'bg-iron',
  storm:     'bg-storm',
  wisdom:    'bg-wisdom',
  bloom:     'bg-bloom',
  moon:      'bg-moon',
}

const BLOCK_LABEL: Record<BlockType, string> = {
  goal:    '',
  meal:    '·',
  rest:    '·',
  leisure: '✦',
  routine: '·',
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function StepRoutineReview({ routine, onContinue }: Props) {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('mon')

  const dayBlocks = routine.blocks
    .filter(b => b.days.includes(activeDay))
    .sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-5 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-7"
      >
        <p className="font-display text-gold text-xs tracking-[0.4em] uppercase mb-3">
          Your Weekly Rhythm
        </p>
        <h2 className="font-display text-2xl sm:text-3xl text-text leading-snug mb-3">
          This is your life.
        </h2>
        <p className="text-muted text-sm leading-relaxed max-w-lg">
          {routine.summary}
        </p>
      </motion.div>

      {/* Day tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex gap-1 mb-5 overflow-x-auto pb-1"
      >
        {DAYS.map(d => (
          <button
            key={d.key}
            onClick={() => setActiveDay(d.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-body tracking-wide transition-all shrink-0 ${
              activeDay === d.key
                ? 'bg-gold/15 border border-gold/40 text-gold'
                : 'border border-border/40 text-muted hover:border-border hover:text-text'
            }`}
          >
            {d.short}
          </button>
        ))}
      </motion.div>

      {/* Day blocks */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-8 pr-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-1.5"
          >
            {dayBlocks.length === 0 && (
              <p className="text-muted/50 text-sm py-8 text-center">Rest day — nothing scheduled.</p>
            )}
            {dayBlocks.map(block => (
              <div
                key={block.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-deep border border-border/40 group"
              >
                {/* Time */}
                <span className="text-muted/60 text-xs font-body w-12 shrink-0">{block.time}</span>

                {/* Elixir dot */}
                <div className="shrink-0">
                  {block.elixirType ? (
                    <div
                      className={`w-2 h-2 rounded-full ${ELIXIR_DOT[block.elixirType]} opacity-80`}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border" />
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text leading-snug">{block.name}</span>
                  {BLOCK_LABEL[block.type] === '✦' && (
                    <span className="ml-2 text-xs text-muted/50">Leisure</span>
                  )}
                </div>

                {/* Duration */}
                <span className="text-muted/50 text-xs shrink-0">{formatDuration(block.duration)}</span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Elixir legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-x-4 gap-y-1.5 mb-8"
      >
        {(Object.entries(ELIXIR_DOT) as [ElixirType, string][]).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${cls}`} />
            <span className="text-muted/60 text-xs capitalize">{type}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between"
      >
        <p className="text-muted/50 text-xs max-w-xs leading-relaxed">
          Ready to begin? Your dragon egg is waiting.
        </p>
        <motion.button
          onClick={onContinue}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/35 text-text rounded-xl hover:bg-gold/18 hover:border-gold/60 transition-all font-body text-sm"
        >
          <span>Meet Your Egg</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </motion.div>
    </div>
  )
}
