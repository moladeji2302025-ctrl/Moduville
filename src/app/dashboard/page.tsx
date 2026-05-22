'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DragonEgg } from '@/components/dragon/DragonEgg'
import { loadRoutine, getCompletions, toggleCompletion } from '@/lib/storage'
import type { DayOfWeek, GeneratedRoutine } from '@/lib/types'

const DAYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

const ELIXIR_COLORS: Record<string, string> = {
  fire: '#e05c2f',
  celestial: '#d4a853',
  iron: '#8a9bb5',
  storm: '#7c6fff',
  wisdom: '#4a7fff',
  bloom: '#3dbd7a',
  moon: '#c4c9e8',
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const router = useRouter()
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => DAYS[new Date().getDay()])
  const [completions, setCompletions] = useState<Set<string>>(new Set())

  const todayKey = toDateKey(new Date())
  const todayDay = DAYS[new Date().getDay()]

  useEffect(() => {
    const r = loadRoutine()
    if (!r) {
      router.replace('/onboarding')
      return
    }
    setRoutine(r)
    setCompletions(getCompletions(todayKey))
  }, [router, todayKey])

  if (!routine) return null

  const dayBlocks = routine.blocks
    .filter(b => b.days.includes(selectedDay))
    .sort((a, b) => a.time.localeCompare(b.time))

  const todayBlocks = routine.blocks.filter(b => b.days.includes(todayDay))
  const warmth = todayBlocks.length === 0
    ? 0.05
    : Math.max(0.05, completions.size / todayBlocks.length)

  function handleToggle(blockId: string) {
    if (selectedDay !== todayDay) return
    setCompletions(toggleCompletion(todayKey, blockId))
  }

  return (
    <main className="min-h-screen bg-void text-text">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 15% 90%, #0a0820 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 88% 10%, #0a0d22 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-16">
        {/* Dragon panel */}
        <div className="flex flex-col items-center pt-10 pb-6">
          <DragonEgg size={110} warmth={warmth} />
          <div className="mt-4 text-center">
            <p className="font-display text-gold text-xs tracking-[0.2em] uppercase mb-1">
              Moduville
            </p>
            {selectedDay === todayDay ? (
              <p className="text-muted text-xs">
                {completions.size} / {todayBlocks.length} blocks completed today
              </p>
            ) : (
              <p className="text-muted text-xs">{DAY_LABELS[selectedDay]} schedule</p>
            )}
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1 mb-5 bg-surface/50 rounded-xl p-1">
          {DAY_ORDER.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wide transition-all duration-200 ${
                day === selectedDay
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : day === todayDay
                  ? 'text-text/70 border border-border/40'
                  : 'text-muted hover:text-text/60'
              }`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>

        {/* Block list */}
        <div className="space-y-2">
          {dayBlocks.length === 0 && (
            <p className="text-center text-muted text-sm py-12 font-body">
              Rest day. No blocks scheduled.
            </p>
          )}
          {dayBlocks.map(block => {
            const color = block.elixirType ? ELIXIR_COLORS[block.elixirType] : '#2a2a4a'
            const done = completions.has(block.id)
            const isToday = selectedDay === todayDay

            return (
              <motion.div
                key={block.id}
                layout
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                  done
                    ? 'bg-surface/20 border-border/20 opacity-55'
                    : 'bg-surface/60 border-border hover:border-border/80'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}70` }}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-display tracking-wide truncate ${
                      done ? 'line-through text-muted' : 'text-text'
                    }`}
                  >
                    {block.name}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {block.time} · {block.duration} min
                  </p>
                </div>

                {isToday && (
                  <button
                    onClick={() => handleToggle(block.id)}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      done
                        ? 'bg-gold/20 border-gold/50 text-gold'
                        : 'border-border hover:border-gold/40 text-transparent hover:text-gold/40'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
