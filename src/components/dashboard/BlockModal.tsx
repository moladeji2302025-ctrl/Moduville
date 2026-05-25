'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Play, Check } from 'lucide-react'
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

type TimerState = 'idle' | 'warmup' | 'full' | 'done'

const WARMUP_SECS = 5 * 60

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface Props {
  block: RoutineBlock
  alreadyDone: boolean
  isToday: boolean
  onComplete: (id: string) => void
  onClose: () => void
}

export function BlockModal({ block, alreadyDone, isToday, onComplete, onClose }: Props) {
  const [state, setState] = useState<TimerState>(alreadyDone ? 'done' : 'idle')
  const [secsLeft, setSecsLeft] = useState(0)
  const [totalSecs, setTotalSecs] = useState(0)

  const color = block.elixirType ? ELIXIR_COLORS[block.elixirType] : '#d4a853'
  const progress = totalSecs > 0 ? (totalSecs - secsLeft) / totalSecs : 0
  const R = 58
  const C = 2 * Math.PI * R

  // Countdown tick
  useEffect(() => {
    if (state !== 'warmup' && state !== 'full') return
    if (secsLeft <= 0) {
      if (state === 'warmup') {
        const fs = block.duration * 60
        setState('full')
        setSecsLeft(fs)
        setTotalSecs(fs)
      } else {
        markDone()
      }
      return
    }
    const id = setTimeout(() => setSecsLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  function markDone() {
    onComplete(block.id)
    setState('done')
  }

  function startWarmup() {
    setState('warmup')
    setSecsLeft(WARMUP_SECS)
    setTotalSecs(WARMUP_SECS)
  }

  function startFull() {
    const s = block.duration * 60
    setState('full')
    setSecsLeft(s)
    setTotalSecs(s)
  }

  const canClose = state === 'idle' || state === 'done'

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/65 z-40"
        onClick={canClose ? onClose : undefined}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/70 rounded-t-2xl px-5 pt-3 pb-10 max-w-lg mx-auto"
      >
        {/* Handle */}
        <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />

        {/* Close */}
        {canClose && (
          <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Block header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            {block.elixirType && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: color, boxShadow: `0 0 5px ${color}` }}
              />
            )}
            <span className="text-muted text-xs font-body">
              {block.time} · {block.duration} min
              {block.elixirType ? ` · ${ELIXIR_NAMES[block.elixirType]}` : ''}
            </span>
          </div>
          <h3 className="font-display text-xl text-text leading-snug">{block.name}</h3>
          {block.description && (
            <p className="text-muted/80 text-sm mt-2 leading-relaxed">{block.description}</p>
          )}
        </div>

        {/* ── DONE state ── */}
        <AnimatePresence>
          {state === 'done' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-7"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `${color}18`, border: `1.5px solid ${color}45` }}
              >
                <Check className="w-7 h-7" style={{ color }} />
              </motion.div>
              <p className="font-display text-sm tracking-wide" style={{ color }}>
                {block.elixirType ? ELIXIR_NAMES[block.elixirType] + ' collected' : 'Block complete'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TIMER state (warmup or full) ── */}
        {(state === 'warmup' || state === 'full') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-5 py-2"
          >
            {/* Circular timer */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r={R} fill="none" stroke="#252440" strokeWidth="5" />
                <motion.circle
                  cx="72" cy="72" r={R}
                  fill="none"
                  stroke={color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  animate={{ strokeDashoffset: C * (1 - progress) }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className="font-display text-2xl text-text tabular-nums">{fmt(secsLeft)}</span>
                <span className="text-muted text-xs">
                  {state === 'warmup' ? 'warm up' : 'remaining'}
                </span>
              </div>
            </div>

            {/* Keep going (appears when warmup ends) */}
            {state === 'warmup' && secsLeft === 0 && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={startFull}
                className="px-6 py-2 rounded-xl text-sm font-body border"
                style={{ color, borderColor: `${color}40`, background: `${color}12` }}
              >
                Keep going →
              </motion.button>
            )}

            {/* Mark complete mid-timer */}
            <button
              onClick={markDone}
              className="px-5 py-2.5 rounded-xl text-sm font-body border transition-all"
              style={{ color, borderColor: `${color}35`, background: `${color}10` }}
            >
              Mark Complete
            </button>
          </motion.div>
        )}

        {/* ── IDLE state ── */}
        {state === 'idle' && isToday && (
          <div className="flex flex-col gap-3">
            {/* Just 5 Minutes — primary CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startWarmup}
              className="w-full py-4 rounded-xl border flex items-center justify-center gap-3 text-base font-body transition-all"
              style={{
                background:   `${color}12`,
                borderColor:  `${color}38`,
                color: '#f0ece3',
              }}
            >
              <Zap className="w-4 h-4" style={{ color }} />
              Just 5 Minutes
            </motion.button>

            {/* Full timer */}
            <button
              onClick={startFull}
              className="w-full py-3 rounded-xl border border-border text-muted hover:text-text hover:border-border/70 flex items-center justify-center gap-2 text-sm font-body transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Start {block.duration} min timer
            </button>

            {/* Quick complete */}
            <button
              onClick={markDone}
              className="w-full py-2 text-muted/55 text-xs font-body hover:text-muted transition-colors"
            >
              Mark complete without timer
            </button>
          </div>
        )}

        {/* Non-today view */}
        {state === 'idle' && !isToday && (
          <p className="text-muted text-sm text-center py-6">
            This block runs on a different day — nothing to do today.
          </p>
        )}
      </motion.div>
    </>
  )
}
