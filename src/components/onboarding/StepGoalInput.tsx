'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Flame, Star, Briefcase, Sparkles, Heart, BookOpen, Activity, Circle, ArrowRight } from 'lucide-react'
import type { UserGoal, GoalCategory } from '@/lib/types'

interface Props {
  onContinue: (goals: UserGoal[]) => void
}

const CATEGORY_CONFIG: Record<
  GoalCategory,
  { icon: React.ElementType; color: string; label: string; elixir: string }
> = {
  fitness:       { icon: Flame,     color: 'text-ember',  label: 'Fitness',       elixir: 'border-ember/40 bg-ember/8' },
  spiritual:     { icon: Star,      color: 'text-gold',   label: 'Spiritual',     elixir: 'border-gold/40 bg-gold/8' },
  business:      { icon: Briefcase, color: 'text-iron',   label: 'Business',      elixir: 'border-iron/40 bg-iron/8' },
  creative:      { icon: Sparkles,  color: 'text-storm',  label: 'Creative',      elixir: 'border-storm/40 bg-storm/8' },
  relationships: { icon: Heart,     color: 'text-bloom',  label: 'Relationships', elixir: 'border-bloom/40 bg-bloom/8' },
  learning:      { icon: BookOpen,  color: 'text-wisdom', label: 'Learning',      elixir: 'border-wisdom/40 bg-wisdom/8' },
  health:        { icon: Activity,  color: 'text-bloom',  label: 'Health',        elixir: 'border-bloom/40 bg-bloom/8' },
  other:         { icon: Circle,    color: 'text-muted',  label: 'Other',         elixir: 'border-border bg-surface' },
}

function detectCategory(text: string): GoalCategory {
  const t = text.toLowerCase()
  if (/fit|workout|gym|run|weight|exercise|sport|body|train/i.test(t)) return 'fitness'
  if (/faith|pray|god|church|spiritual|worship|devotion|bible|meditat/i.test(t)) return 'spiritual'
  if (/business|money|income|revenue|client|launch|startup|entrepreneur|brand/i.test(t)) return 'business'
  if (/content|social media|youtube|instagram|tiktok|creative|write|music|art|creat|film/i.test(t)) return 'creative'
  if (/relationship|friend|family|partner|love|social|connect|dating/i.test(t)) return 'relationships'
  if (/learn|study|course|skill|read|book|knowledge|degree|certif/i.test(t)) return 'learning'
  if (/health|diet|nutrition|mental|sleep|wellbeing/i.test(t)) return 'health'
  return 'other'
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function StepGoalInput({ onContinue }: Props) {
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [input, setInput] = useState('')

  function addGoal() {
    const text = input.trim()
    if (!text) return
    setGoals(prev => [
      ...prev,
      { id: makeId(), text, category: detectCategory(text) },
    ])
    setInput('')
  }

  function removeGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addGoal()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-10"
        >
          <p className="font-display text-gold text-xs tracking-[0.4em] uppercase mb-4">
            Step 1 of 2
          </p>
          <h2 className="font-display text-3xl sm:text-4xl text-text mb-3 leading-tight">
            What do you want to build?
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            Don&apos;t hold back. Enter every goal that matters to you right now — Moduville will build one unified routine around all of them.
          </p>
        </motion.div>

        {/* Input row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex gap-2 mb-6"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. I want to grow my social media to 10k..."
            className="flex-1 bg-deep border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted/60 focus:outline-none focus:border-gold/50 transition-colors"
          />
          <motion.button
            onClick={addGoal}
            disabled={!input.trim()}
            whileTap={{ scale: 0.94 }}
            className="p-3 bg-gold/10 border border-gold/30 rounded-xl text-gold hover:bg-gold/18 hover:border-gold/55 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Goals list */}
        <AnimatePresence>
          {goals.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 mb-8"
            >
              {goals.map(goal => {
                const cfg = CATEGORY_CONFIG[goal.category]
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -10, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cfg.elixir}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                    <span className="flex-1 text-sm text-text leading-snug">{goal.text}</span>
                    <span className={`text-xs font-body ${cfg.color} opacity-70 shrink-0`}>
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => removeGoal(goal.id)}
                      className="ml-1 text-muted/50 hover:text-muted transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {goals.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted/50 text-sm text-center py-8"
          >
            Your goals will appear here. Add as many as you have.
          </motion.p>
        )}

        {/* Continue */}
        <AnimatePresence>
          {goals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <p className="text-muted/60 text-xs">
                {goals.length} goal{goals.length !== 1 ? 's' : ''} added
              </p>
              <motion.button
                onClick={() => onContinue(goals)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-ember/10 border border-ember/35 text-text rounded-xl hover:bg-ember/20 hover:border-ember/65 transition-all duration-300 font-body text-sm"
              >
                <span>Build My Routine</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
