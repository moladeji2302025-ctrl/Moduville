'use client'

import { motion } from 'framer-motion'
import { X, CheckCircle2, Clock, Calendar } from 'lucide-react'
import type { GeneratedRoutine, RoutineBlock, UserGoal } from '@/lib/types'
import type { NodeState } from './DailyRoadmap'

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

interface Props {
  block:       RoutineBlock
  state:       NodeState
  isToday:     boolean
  routine:     GeneratedRoutine
  goals:       UserGoal[]
  alreadyDone: boolean
  onToggle:    () => void
  onClose:     () => void
}

export function RoadmapDetailSheet({
  block, state, isToday, routine, goals, alreadyDone, onToggle, onClose,
}: Props) {
  const durationLabel = block.duration >= 60
    ? `${Math.floor(block.duration / 60)}h${block.duration % 60 > 0 ? ` ${block.duration % 60}m` : ''}`
    : `${block.duration} min`

  const weeklyHrs = (block.duration * block.days.length / 60).toFixed(1)

  // Match this block to goals via goalMapping (goal text → [block names])
  const impactedGoals = goals.filter(goal => {
    const blockNames = routine.goalMapping[goal.text] ?? []
    return blockNames.some(
      name =>
        name.toLowerCase() === block.name.toLowerCase() ||
        block.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
        name.toLowerCase().includes(block.name.toLowerCase().split(' ')[0])
    )
  })

  const stateLabel =
    state === 'completed' ? 'Completed' :
    state === 'active'    ? 'Active now' :
    state === 'missed'    ? 'Missed' :
    'Upcoming'

  const statePill =
    state === 'completed' ? 'border-gold/30 text-gold bg-gold/10' :
    state === 'active'    ? 'border-storm/40 text-storm bg-storm/10' :
    state === 'missed'    ? 'border-ember/30 text-ember/70 bg-ember/8' :
    'border-border/30 text-muted bg-surface/40'

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/55 z-40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 38 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/40 rounded-t-3xl px-5 pt-4 pb-10 max-w-lg mx-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border/40 rounded-full mx-auto mb-5" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-text transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-text text-lg tracking-wide leading-tight">{block.name}</h2>
            <span className={`inline-block mt-1.5 text-[10px] font-body px-2.5 py-0.5 rounded-full border ${statePill}`}>
              {stateLabel}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1.5 text-muted text-xs font-body">
            <Clock className="w-3 h-3" />
            {block.time} · {durationLabel}
          </span>
          <span className="flex items-center gap-1.5 text-muted text-xs font-body">
            <Calendar className="w-3 h-3" />
            {block.days.map(d => DAY_LABELS[d]).join(' · ')}
          </span>
        </div>

        {/* Description */}
        {block.description && (
          <p className="text-muted/70 text-xs font-body leading-relaxed mb-5 border-l-2 border-border/40 pl-3">
            {block.description}
          </p>
        )}

        {/* Goal impact */}
        {impactedGoals.length > 0 && (
          <div className="mb-5">
            <p className="text-muted/50 text-[10px] font-body uppercase tracking-wider mb-3">
              Goal Impact
            </p>
            <div className="space-y-3">
              {impactedGoals.map(goal => {
                const siblingCount = (routine.goalMapping[goal.text] ?? []).length
                const pct = siblingCount > 0 ? Math.min(90, Math.round(100 / siblingCount)) : 25
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-text/75 text-[11px] font-body leading-snug pr-3 flex-1 truncate">
                        {goal.text}
                      </p>
                      <span className="text-gold text-[10px] font-body shrink-0 tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-border/25 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #d4a853aa, #d4a853)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 px-3 py-2.5 rounded-xl bg-surface/60 border border-border/30 text-center">
            <p className="text-muted/45 text-[9px] font-body uppercase tracking-wider">Weekly</p>
            <p className="text-text text-sm font-display mt-0.5">{weeklyHrs} hrs</p>
          </div>
          <div className="flex-1 px-3 py-2.5 rounded-xl bg-surface/60 border border-border/30 text-center">
            <p className="text-muted/45 text-[9px] font-body uppercase tracking-wider">Per session</p>
            <p className="text-text text-sm font-display mt-0.5">{durationLabel}</p>
          </div>
          <div className="flex-1 px-3 py-2.5 rounded-xl bg-surface/60 border border-border/30 text-center">
            <p className="text-muted/45 text-[9px] font-body uppercase tracking-wider">Days/wk</p>
            <p className="text-text text-sm font-display mt-0.5">{block.days.length}×</p>
          </div>
        </div>

        {/* Complete button — only for today and non-rest blocks */}
        {isToday && block.type !== 'rest' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onToggle}
            className={`w-full py-3.5 rounded-2xl font-display text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
              alreadyDone
                ? 'bg-surface/60 border border-gold/35 text-gold'
                : 'bg-gold text-void hover:bg-gold/90'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {alreadyDone ? 'Completed ✓' : 'Mark Complete'}
          </motion.button>
        )}
      </motion.div>
    </>
  )
}
