'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import {
  loadRoutine, getCompletions,
  getDragonStage, calcGoodWeeksFromHistory,
} from '@/lib/storage'
import { DragonEvolution } from '@/components/dragon/DragonEvolution'
import type { DayOfWeek, DragonStage, ElixirType, GeneratedRoutine } from '@/lib/types'

// ── Lookups ───────────────────────────────────────────────────────────────────

const DOW_MAP: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire: '#e05c2f', celestial: '#d4a853', iron: '#8a9bb5',
  storm: '#7c6fff', wisdom: '#4a7fff', bloom: '#3dbd7a', moon: '#c4c9e8',
}
const ELIXIR_LABELS: Record<ElixirType, string> = {
  fire: 'Fire', celestial: 'Celestial', iron: 'Iron',
  storm: 'Storm', wisdom: 'Wisdom', bloom: 'Bloom', moon: 'Moon',
}
const DAY_NAMES: Record<DayOfWeek, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}
const STAGE_LABELS: Record<DragonStage, string> = {
  egg: 'Unhatched', hatching: 'Stirring', baby: 'Hatchling', adult: 'The Sovereign',
}
const NEXT_STAGE: Partial<Record<DragonStage, { label: string; at: number }>> = {
  egg:      { label: 'Stirring',     at: 1 },
  hatching: { label: 'Hatchling',    at: 3 },
  baby:     { label: 'The Sovereign', at: 7 },
}

// ── Data ──────────────────────────────────────────────────────────────────────

interface WrapData {
  weekLabel: string
  weekNumber: number
  totalScheduled: number
  totalCompleted: number
  completionRate: number
  goalMinutes: number
  bestDay: { label: string; completed: number; total: number } | null
  elixirCounts: Partial<Record<ElixirType, number>>
  dominantElixir: ElixirType | null
  totalElixirs: number
  dragonStage: DragonStage
  goodWeeks: number
  isGoodWeek: boolean
}

function getWeekDates(): string[] {
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    if (d <= today) dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function computeData(routine: GeneratedRoutine): WrapData {
  const dates = getWeekDates()
  let totalScheduled = 0, totalCompleted = 0, goalMinutes = 0
  const elixirCounts: Partial<Record<ElixirType, number>> = {}
  const dayStats: Array<{ dow: DayOfWeek; completed: number; total: number }> = []

  for (const dateStr of dates) {
    const dow = DOW_MAP[new Date(dateStr).getDay()]
    const scheduled = routine.blocks.filter(b => b.days.includes(dow))
    const done = scheduled.filter(b => getCompletions(dateStr).has(b.id))
    totalScheduled += scheduled.length
    totalCompleted += done.length
    dayStats.push({ dow, completed: done.length, total: scheduled.length })
    for (const b of done) {
      if (b.type === 'goal') {
        goalMinutes += b.duration
        if (b.elixirType) elixirCounts[b.elixirType] = (elixirCounts[b.elixirType] ?? 0) + 1
      }
    }
  }

  const bestDayStat = dayStats
    .filter(d => d.total > 0)
    .sort((a, b) => (b.completed / b.total) - (a.completed / a.total))[0]

  const elixirEntries = Object.entries(elixirCounts) as [ElixirType, number][]
  const dominantElixir = elixirEntries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const totalElixirs = elixirEntries.reduce((s, [, n]) => s + n, 0)
  const completionRate = totalScheduled > 0 ? totalCompleted / totalScheduled : 0

  const today = new Date()
  const yearStart = new Date(today.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(
    ((today.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7,
  )

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weekLabel = dates.length > 1
    ? `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`
    : dates.length === 1 ? fmt(dates[0]) : ''

  return {
    weekLabel, weekNumber,
    totalScheduled, totalCompleted, completionRate,
    goalMinutes,
    bestDay: bestDayStat
      ? { label: DAY_NAMES[bestDayStat.dow], completed: bestDayStat.completed, total: bestDayStat.total }
      : null,
    elixirCounts, dominantElixir, totalElixirs,
    dragonStage: getDragonStage(),
    goodWeeks: calcGoodWeeksFromHistory(routine),
    isGoodWeek: completionRate >= 0.6,
  }
}

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimCount({ to, delay = 0 }: { to: number; delay?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let raf: number
    const t = setTimeout(() => {
      const t0 = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - t0) / 900, 1)
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [to, delay])
  return <>{val}</>
}

// ── Slide transition ──────────────────────────────────────────────────────────

const VARIANTS = {
  enter:  (d: number) => ({ x: d > 0 ? '65%' : '-65%', opacity: 0, scale: 0.93 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit:   (d: number) => ({ x: d > 0 ? '-65%' : '65%', opacity: 0, scale: 0.93 }),
}
const TRANS = { duration: 0.38, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WeeklyWrapPage() {
  const router  = useRouter()
  const [data, setData]   = useState<WrapData | null>(null)
  const [slide, setSlide] = useState(0)
  const [dir,   setDir]   = useState(1)

  useEffect(() => {
    const r = loadRoutine()
    if (!r) { router.replace('/dashboard'); return }
    setData(computeData(r))
  }, [router])

  const TOTAL = 7

  const advance = useCallback(() => {
    setDir(1); setSlide(s => Math.min(s + 1, TOTAL - 1))
  }, [])

  const back = useCallback(() => {
    if (slide === 0) { router.replace('/dashboard'); return }
    setDir(-1); setSlide(s => s - 1)
  }, [slide, router])

  if (!data) return null

  const pct     = Math.round(data.completionRate * 100)
  const hrs     = Math.floor(data.goalMinutes / 60)
  const mins    = data.goalMinutes % 60
  const accent  = data.dominantElixir ? ELIXIR_COLORS[data.dominantElixir] : '#d4a853'
  const next    = NEXT_STAGE[data.dragonStage]

  // ── Slides ──────────────────────────────────────────────────────────────────

  const slides: React.ReactNode[] = [

    /* 0 — Intro */
    <div
      key="intro"
      className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
    >
      <motion.p
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="font-display text-[11px] tracking-[0.45em] uppercase text-gold mb-4"
      >
        Week {data.weekNumber} · {data.weekLabel}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="font-display text-text text-4xl leading-tight"
      >
        Your Week<br />in Moduville
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        className="my-10"
      >
        <motion.span
          className="text-5xl" style={{ color: '#d4a853' }}
          animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2.4, repeat: Infinity }}
        >◈</motion.span>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
        className="text-muted/50 text-xs font-body"
      >Tap anywhere to begin</motion.p>
    </div>,

    /* 1 — Completion rate */
    <div
      key="completion"
      className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
    >
      <motion.p
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="font-display text-[11px] tracking-[0.42em] uppercase mb-6"
        style={{ color: accent }}
      >Completion</motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.16, type: 'spring', stiffness: 140 }}
        className="font-display leading-none mb-4 tabular-nums"
        style={{ fontSize: 'clamp(96px, 23vw, 144px)', color: accent }}
      >
        <AnimCount to={pct} delay={260} />
        <span style={{ fontSize: '0.42em' }}>%</span>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
        className="text-text/80 text-lg font-display tracking-wide mb-2"
      >of your blocks, done</motion.p>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
        className="text-muted text-sm"
      >{data.totalCompleted} of {data.totalScheduled} completed</motion.p>
    </div>,

    /* 2 — Best day */
    <div
      key="best-day"
      className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
    >
      <motion.p
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="font-display text-[11px] tracking-[0.42em] uppercase text-muted mb-8"
      >Your strongest day</motion.p>
      {data.bestDay ? (
        <>
          <motion.h2
            initial={{ opacity: 0, scale: 0.78 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 135 }}
            className="font-display leading-none mb-5"
            style={{ fontSize: 'clamp(46px, 13vw, 72px)', color: accent }}
          >{data.bestDay.label.toUpperCase()}</motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
            className="text-text/75 text-xl font-display tracking-wide"
          >{data.bestDay.completed} of {data.bestDay.total} blocks</motion.p>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.58 }}
            className="text-muted text-sm mt-2"
          >{Math.round((data.bestDay.completed / data.bestDay.total) * 100)}% completion rate</motion.p>
        </>
      ) : (
        <p className="text-muted text-sm">No blocks tracked yet this week.</p>
      )}
    </div>,

    /* 3 — Time invested */
    <div
      key="time-invested"
      className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
    >
      <motion.p
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="font-display text-[11px] tracking-[0.42em] uppercase text-muted mb-6"
      >Time invested</motion.p>
      {data.goalMinutes > 0 ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 130 }}
            className="font-display leading-none mb-5 tabular-nums"
            style={{ fontSize: 'clamp(68px, 17vw, 108px)', color: '#4a7fff' }}
          >
            {hrs > 0 ? (
              <>
                <AnimCount to={hrs} delay={260} />
                <span style={{ fontSize: '0.38em' }}>h&nbsp;</span>
                <AnimCount to={mins} delay={380} />
                <span style={{ fontSize: '0.38em' }}>m</span>
              </>
            ) : (
              <>
                <AnimCount to={mins} delay={260} />
                <span style={{ fontSize: '0.38em' }}>m</span>
              </>
            )}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-text/75 text-lg font-display tracking-wide"
          >poured into your goals</motion.p>
        </>
      ) : (
        <p className="text-muted text-sm">No goal blocks completed yet this week.</p>
      )}
    </div>,

    /* 4 — Elixirs */
    <div
      key="elixirs"
      className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
    >
      <motion.p
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="font-display text-[11px] tracking-[0.42em] uppercase text-muted mb-5"
      >Elixirs brewed</motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18, type: 'spring', stiffness: 138 }}
        className="font-display leading-none mb-5 tabular-nums"
        style={{ fontSize: 'clamp(88px, 21vw, 130px)', color: accent }}
      >
        <AnimCount to={data.totalElixirs} delay={260} />
      </motion.div>
      {data.dominantElixir && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
          className="mb-6"
        >
          <p className="text-muted text-xs mb-1">Dominant essence</p>
          <p className="font-display tracking-[0.3em] text-base"
            style={{ color: ELIXIR_COLORS[data.dominantElixir] }}>
            {ELIXIR_LABELS[data.dominantElixir].toUpperCase()} ELIXIR
          </p>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.64 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {(Object.entries(data.elixirCounts) as [ElixirType, number][])
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => (
            <div key={type}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{ borderColor: `${ELIXIR_COLORS[type]}35`, background: `${ELIXIR_COLORS[type]}12` }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ELIXIR_COLORS[type] }} />
              <span className="text-xs font-body" style={{ color: ELIXIR_COLORS[type] }}>{ELIXIR_LABELS[type]}</span>
              <span className="text-muted/60 text-xs">×{count}</span>
            </div>
          ))}
        {data.totalElixirs === 0 && (
          <p className="text-muted text-sm">No goal blocks completed yet.</p>
        )}
      </motion.div>
    </div>,

    /* 5 — Dragon */
    <div
      key="dragon"
      className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
    >
      <motion.p
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="font-display text-[11px] tracking-[0.42em] uppercase text-muted mb-5"
      >Your dragon</motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 128 }}
        className="mb-4"
      >
        <DragonEvolution
          stage={data.dragonStage}
          warmth={data.completionRate}
          glowColor={accent}
          size={124}
          showEvolution={false}
          evolvingTo={null}
          onEvolutionDone={() => {}}
        />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
        className="font-display text-text text-xl tracking-wide mb-4"
      >{STAGE_LABELS[data.dragonStage]}</motion.p>
      {next ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
          className="w-full max-w-[240px]"
        >
          <p className="text-muted text-xs mb-2.5">
            {next.at - data.goodWeeks} more good {next.at - data.goodWeeks === 1 ? 'week' : 'weeks'} to reach {next.label}
          </p>
          <div className="h-1 rounded-full bg-border/35 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (data.goodWeeks / next.at) * 100)}%` }}
              transition={{ delay: 0.85, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ background: accent }}
            />
          </div>
          <p className="text-muted/45 text-[10px] mt-1.5">{data.goodWeeks} / {next.at} good weeks</p>
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 }}
          className="font-display text-[11px] tracking-[0.32em] uppercase"
          style={{ color: accent }}
        >Maximum evolution reached</motion.p>
      )}
    </div>,

    /* 6 — Sign off */
    <div
      key="sign-off"
      className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.55 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
        className="text-4xl mb-8"
        style={{ color: data.isGoodWeek ? '#d4a853' : '#9896b8' }}
      >
        <motion.span
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        >{data.isGoodWeek ? '✦' : '❋'}</motion.span>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="font-display text-text text-3xl leading-snug mb-4 whitespace-pre-line"
      >
        {data.isGoodWeek ? 'A good week.\nThe city felt it.' : 'Every week\nis a new start.'}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
        className="text-muted text-sm leading-relaxed max-w-[280px] mb-12"
      >
        {data.isGoodWeek
          ? 'Keep the rhythm. The dragon grows with every week you show up.'
          : 'Small actions compound. One block at a time — the city is patient.'}
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.68 }}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={e => { e.stopPropagation(); router.replace('/dashboard') }}
        className="px-8 py-3 rounded-full border font-body text-sm transition-colors"
        style={{
          borderColor: data.isGoodWeek ? '#d4a85355' : '#9896b835',
          color: data.isGoodWeek ? '#d4a853' : '#9896b8',
        }}
      >Back to Dashboard</motion.button>
    </div>,
  ]

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <main
      className="fixed inset-0 bg-void text-text overflow-hidden"
      onClick={slide < TOTAL - 1 ? advance : undefined}
    >
      {/* Dynamic ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 42%, ${accent}0e 0%, transparent 65%)`,
        }}
      />

      {/* Back button */}
      <button
        onClick={e => { e.stopPropagation(); back() }}
        className="absolute top-5 left-4 z-20 p-2 text-muted/55 hover:text-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Progress pills */}
      <div className="absolute top-[22px] inset-x-0 flex justify-center gap-1.5 z-20 pointer-events-none">
        {slides.map((_, i) => (
          <motion.div
            key={i}
            className="rounded-full bg-border"
            animate={{
              width:   i === slide ? 20 : 5,
              opacity: i === slide ? 1 : i < slide ? 0.5 : 0.22,
              backgroundColor: i === slide ? accent : '#2a2a4a',
            }}
            transition={{ duration: 0.28 }}
            style={{ height: 4 }}
          />
        ))}
      </div>

      {/* Slide */}
      <AnimatePresence custom={dir} mode="wait">
        <motion.div
          key={slide}
          custom={dir}
          variants={VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={TRANS}
          className="absolute inset-0 flex flex-col"
        >
          {slides[slide]}
        </motion.div>
      </AnimatePresence>

      {/* Tap hint */}
      {slide < TOTAL - 1 && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-7 inset-x-0 text-center text-muted/30 text-[11px] font-body pointer-events-none"
        >tap to continue</motion.p>
      )}
    </main>
  )
}
