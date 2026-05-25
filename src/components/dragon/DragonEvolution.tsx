'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DragonEgg } from './DragonEgg'
import { BabyDragon } from './BabyDragon'
import { AdultDragon } from './AdultDragon'
import type { DragonStage } from '@/lib/types'

const STAGE_LABELS: Record<DragonStage, string> = {
  egg:      'Unhatched',
  hatching: 'Stirring',
  baby:     'Hatchling',
  adult:    'The Sovereign',
}

const EVOLUTION_EVENTS: Record<Exclude<DragonStage, 'egg'>, {
  title: string
  subtitle: string
  symbol: string
  color: string
}> = {
  hatching: {
    title:    'The Egg Stirs',
    subtitle: 'Your consistency is cracking the shell. Something wakes inside.',
    symbol:   '◈',
    color:    '#d4a853',
  },
  baby: {
    title:    'A Dragon Is Born',
    subtitle: 'From patience and ritual, new life enters the world.',
    symbol:   '✦',
    color:    '#7c6fff',
  },
  adult: {
    title:    'The Dragon Ascends',
    subtitle: 'Your sovereignty is undeniable. The city kneels.',
    symbol:   '❋',
    color:    '#e05c2f',
  },
}

interface Props {
  stage: DragonStage
  warmth: number
  glowColor?: string
  size?: number
  showEvolution: boolean
  evolvingTo: DragonStage | null
  onEvolutionDone: () => void
}

export function DragonEvolution({
  stage,
  warmth,
  glowColor,
  size = 108,
  showEvolution,
  evolvingTo,
  onEvolutionDone,
}: Props) {
  const color = glowColor ?? '#7c6fff'

  useEffect(() => {
    if (!showEvolution) return
    const id = setTimeout(onEvolutionDone, 5500)
    return () => clearTimeout(id)
  }, [showEvolution, onEvolutionDone])

  return (
    <>
      {/* Dragon visual (swaps on stage change) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <DragonStageView stage={stage} size={size} color={color} warmth={warmth} />
        </motion.div>
      </AnimatePresence>

      {/* Stage label */}
      <p className="text-muted/55 text-[10px] font-display tracking-[0.25em] uppercase mt-1.5">
        {STAGE_LABELS[stage]}
      </p>

      {/* Evolution overlay (fixed, outside layout flow) */}
      <AnimatePresence>
        {showEvolution && evolvingTo && evolvingTo !== 'egg' && (
          <EvolutionOverlay
            stage={evolvingTo}
            color={color}
            warmth={warmth}
            onDismiss={onEvolutionDone}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function DragonStageView({
  stage, size, color, warmth,
}: { stage: DragonStage; size: number; color: string; warmth: number }) {
  switch (stage) {
    case 'egg':
      return <DragonEgg size={size} warmth={warmth} />
    case 'hatching':
      return <DragonEgg size={size} warmth={Math.max(warmth, 0.72)} glowColor="#d4a853" />
    case 'baby':
      return <BabyDragon size={size} color={color} warmth={warmth} />
    case 'adult':
      return <AdultDragon size={size} color={color} warmth={warmth} />
  }
}

interface OverlayProps {
  stage: Exclude<DragonStage, 'egg'>
  color: string
  warmth: number
  onDismiss: () => void
}

function EvolutionOverlay({ stage, color, warmth, onDismiss }: OverlayProps) {
  const event = EVOLUTION_EVENTS[stage]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6 select-none"
      style={{ background: 'rgba(7, 7, 20, 0.97)' }}
      onClick={onDismiss}
    >
      {/* Radial bloom behind dragon */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0.3] }}
        transition={{ duration: 1.5 }}
        style={{
          background: `radial-gradient(ellipse 55% 45% at 50% 50%, ${event.color}18 0%, transparent 70%)`,
        }}
      />

      {/* Symbol */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.4, 1], opacity: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="text-5xl mb-3 leading-none"
        style={{ color: event.color }}
      >
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          {event.symbol}
        </motion.span>
      </motion.div>

      {/* Stage name */}
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="font-display text-[10px] tracking-[0.45em] uppercase mb-7"
        style={{ color: event.color }}
      >
        {STAGE_LABELS[stage]}
      </motion.p>

      {/* Dragon */}
      <motion.div
        initial={{ scale: 0.65, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
        className="mb-9 pointer-events-none"
      >
        <DragonStageView stage={stage} size={128} color={color} warmth={warmth} />
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="font-display text-text text-2xl tracking-wide text-center mb-3"
      >
        {event.title}
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.95 }}
        className="text-muted text-sm text-center leading-relaxed max-w-xs"
      >
        {event.subtitle}
      </motion.p>

      {/* Continue button (appears after 2s) */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="mt-10 px-8 py-3 rounded-full border text-sm font-body transition-colors"
        style={{ borderColor: `${event.color}40`, color: event.color }}
        onClick={e => { e.stopPropagation(); onDismiss() }}
      >
        Continue
      </motion.button>
    </motion.div>
  )
}
