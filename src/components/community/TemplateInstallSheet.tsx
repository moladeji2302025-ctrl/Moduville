'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Star, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import type { RoutineTemplate } from '@/lib/types'
import { loadRoutine, addBlocks, markTemplateInstalled } from '@/lib/storage'
import { adaptTemplateToRoutine } from '@/lib/routineTemplates'

const ELIXIR_COLORS: Record<string, string> = {
  fire: '#e05c2f', celestial: '#d4a853', iron: '#8a9bb5',
  storm: '#7c6fff', wisdom: '#4a7fff', bloom: '#3dbd7a', moon: '#c4c9e8',
}

const SCORE_COLOR = (s: number) =>
  s >= 9   ? '#d4a853' :
  s >= 7.5 ? '#3dbd7a' :
  s >= 6   ? '#8a9bb5' : '#9896b8'

const BLOCK_EMOJIS: [RegExp, string][] = [
  [/workout|gym|exercise|lift|run|cardio|strength/i, '🏋️'],
  [/sleep|nap|rest|recovery/i, '😴'],
  [/breakfast|lunch|dinner|meal|eat|food/i, '🍽️'],
  [/meditat|pray|spiritual|devotion/i, '🧘'],
  [/work|deep work|session|build|ship/i, '💼'],
  [/study|learn|read|review|recall/i, '📚'],
  [/social|friend|family|call|connect|date/i, '👥'],
  [/creat|content|write|record|edit/i, '🎨'],
  [/walk|outdoor|stroll/i, '🚶'],
  [/plan|journal|reflect|intention/i, '📝'],
  [/stretch|yoga|mobility/i, '🤸'],
  [/coffee|tea|break/i, '☕'],
]

function blockEmoji(name: string, desc = ''): string {
  const text = `${name} ${desc}`
  for (const [pat, emoji] of BLOCK_EMOJIS) {
    if (pat.test(text)) return emoji
  }
  return '📌'
}

interface Props {
  template:   RoutineTemplate
  onClose:    () => void
  onInstalled: () => void
}

export function TemplateInstallSheet({ template, onClose, onInstalled }: Props) {
  const [phase, setPhase] = useState<'preview' | 'installing' | 'done'>('preview')
  const [addedCount, setAddedCount] = useState(0)
  const color = ELIXIR_COLORS[template.elixirType]

  async function handleInstall() {
    setPhase('installing')
    // Simulate brief adaptation delay for UX
    await new Promise(r => setTimeout(r, 1600))

    const routine = loadRoutine()
    const existingBlocks = routine?.blocks ?? []
    const adapted = adaptTemplateToRoutine(template.blocks, existingBlocks)
    addBlocks(adapted)
    markTemplateInstalled(template.id)
    setAddedCount(adapted.length)
    setPhase('done')
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
        onClick={phase === 'preview' ? onClose : undefined}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 330, damping: 38 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/40 rounded-t-3xl max-w-lg mx-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border/40 rounded-full mx-auto mt-3.5" />

        {/* Close */}
        {phase !== 'installing' && (
          <button
            onClick={phase === 'done' ? onInstalled : onClose}
            className="absolute top-3.5 right-4 p-1.5 text-muted hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* ── Preview phase ── */}
        {phase === 'preview' && (
          <div className="px-5 pt-4 pb-10">
            {/* Header */}
            <div className="flex items-start gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-body uppercase tracking-[0.3em] mb-1"
                  style={{ color }}
                >
                  {template.goalCategory}
                </p>
                <h2 className="font-display text-text text-lg tracking-wide leading-tight">{template.title}</h2>
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border flex-shrink-0"
                style={{ borderColor: `${SCORE_COLOR(template.consultantScore)}40`, background: `${SCORE_COLOR(template.consultantScore)}12` }}
              >
                <Star className="w-3 h-3" style={{ color: SCORE_COLOR(template.consultantScore) }} />
                <span className="text-xs font-display tabular-nums" style={{ color: SCORE_COLOR(template.consultantScore) }}>
                  {template.consultantScore.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Consultant review */}
            <p className="text-muted/60 text-xs font-body italic mb-4 mt-1">
              &ldquo;{template.consultantReview}&rdquo;
            </p>

            {/* Creator note */}
            <div
              className="px-3.5 py-3 rounded-xl border mb-5"
              style={{ borderColor: `${color}30`, background: `${color}0a` }}
            >
              <p className="text-muted/50 text-[9px] font-body uppercase tracking-wider mb-1.5">
                @{template.creatorUsername} says
              </p>
              <p className="text-text/75 text-xs font-body leading-relaxed">&ldquo;{template.creatorNote}&rdquo;</p>
            </div>

            {/* Block list */}
            <p className="text-muted/50 text-[10px] font-body uppercase tracking-wider mb-2.5">
              {template.blocks.length} blocks included
            </p>
            <div className="space-y-2 mb-6">
              {template.blocks.map(b => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50 border border-border/30"
                >
                  <span className="text-base leading-none">{blockEmoji(b.name, b.description)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text/80 text-xs font-display tracking-wide truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-muted/50 text-[9px] font-body flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {b.time}
                      </span>
                      <span className="text-muted/35 text-[9px] font-body">
                        {b.duration >= 60
                          ? `${Math.floor(b.duration / 60)}h${b.duration % 60 ? ` ${b.duration % 60}m` : ''}`
                          : `${b.duration} min`}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-body px-1.5 py-0.5 rounded-full border flex-shrink-0 capitalize"
                    style={{ color, borderColor: `${color}35`, background: `${color}10` }}
                  >
                    {b.type}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleInstall}
              className="w-full py-3.5 rounded-2xl font-display text-sm tracking-wide text-void"
              style={{ background: color }}
            >
              Adapt & Install to My Routine
            </motion.button>
            <p className="text-center text-muted/40 text-[10px] font-body mt-2.5">
              The Consultant will shift times to avoid schedule conflicts.
            </p>
          </div>
        )}

        {/* ── Installing phase ── */}
        {phase === 'installing' && (
          <div className="px-5 pt-8 pb-12 flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-8 h-8" style={{ color }} />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-text text-base tracking-wide">Consulting the Adviser…</p>
              <p className="text-muted text-xs font-body mt-1">Checking your schedule for conflicts</p>
            </div>
          </div>
        )}

        {/* ── Done phase ── */}
        {phase === 'done' && (
          <div className="px-5 pt-8 pb-12 flex flex-col items-center gap-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <CheckCircle2 className="w-12 h-12" style={{ color }} />
            </motion.div>
            <div className="text-center">
              <p className="font-display text-text text-base tracking-wide">Routine Installed</p>
              <p className="text-muted text-xs font-body mt-1">
                {addedCount} blocks adapted and added to your schedule.
              </p>
              <p className="text-muted/50 text-[10px] font-body mt-3">
                @{template.creatorUsername} earned Elixir for your install ✦
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onInstalled}
              className="px-8 py-3 rounded-2xl font-display text-sm tracking-wide"
              style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
            >
              Done
            </motion.button>
          </div>
        )}
      </motion.div>
    </>
  )
}
