'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Link2, FileText, Video, Camera, Check, SlidersHorizontal } from 'lucide-react'
import { loadProofs, getAllCompletions, loadRoutine } from '@/lib/storage'
import type { BlockType, DayOfWeek, ElixirType, GeneratedRoutine, ProofEntry, ProofStatus, ProofType, RoutineBlock } from '@/lib/types'

// ── Color maps ────────────────────────────────────────────────────────────────

const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire: '#e05c2f', celestial: '#d4a853', iron: '#8a9bb5',
  storm: '#7c6fff', wisdom: '#4a7fff', bloom: '#3dbd7a', moon: '#c4c9e8',
}
const TYPE_COLORS: Record<BlockType, string> = {
  goal: '#d4a853', routine: '#8a9bb5', meal: '#3dbd7a', rest: '#c4c9e8', leisure: '#7c6fff',
}
const STATUS_COLOR: Record<ProofStatus, string> = {
  approved: '#3dbd7a', uncertain: '#d4a853', rejected: '#e05c2f',
}
const PROOF_ICON: Record<ProofType, React.ElementType> = {
  social: Link2, document: FileText, video: Video, photo: Camera,
}
const TYPE_LABELS: Record<BlockType, string> = {
  goal: 'Goal', routine: 'Routine', meal: 'Meal', rest: 'Rest', leisure: 'Leisure',
}
const DOW_MAP: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function blockColor(b: RoutineBlock) {
  return b.elixirType ? ELIXIR_COLORS[b.elixirType] : TYPE_COLORS[b.type]
}

function isoToday() { return new Date().toISOString().slice(0, 10) }

function fmtDate(iso: string) {
  const today = isoToday()
  const yest  = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  if (iso === today) return 'Today'
  if (iso === yest)  return 'Yesterday'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Day card ──────────────────────────────────────────────────────────────────

interface DayCardProps {
  date:         string
  blocks:       RoutineBlock[]
  completedIds: Set<string>
  proofs:       ProofEntry[]
  typeFilter:   BlockType | null
}

function DayCard({ date, blocks, completedIds, proofs, typeFilter }: DayCardProps) {
  const visible = typeFilter ? blocks.filter(b => b.type === typeFilter) : blocks
  if (visible.length === 0) return null

  const proofMap = new Map(proofs.map(p => [p.blockId, p]))
  const hasAny   = visible.some(b => completedIds.has(b.id) || proofMap.has(b.id))
  if (!hasAny) return null

  return (
    <div className="mb-4">
      <p className="text-muted text-[10px] font-display tracking-[0.3em] uppercase mb-2 px-1">
        {fmtDate(date)}
      </p>
      <div className="space-y-1.5">
        {visible.map(block => {
          const done  = completedIds.has(block.id)
          const proof = proofMap.get(block.id)
          const color = blockColor(block)
          const Icon  = proof ? PROOF_ICON[proof.type] : null

          return (
            <div
              key={block.id}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all ${
                proof
                  ? 'bg-surface/50 border-border/60'
                  : done
                  ? 'bg-surface/25 border-border/30 opacity-60'
                  : 'bg-surface/10 border-border/15 opacity-30'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}55` }}
              />

              <p className={`flex-1 text-sm font-display tracking-wide truncate ${done ? 'text-text' : 'text-muted'}`}>
                {block.name}
              </p>

              {done && !proof && (
                <Check className="w-3.5 h-3.5 text-muted/50 flex-shrink-0" />
              )}

              {proof && Icon && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Icon className="w-3 h-3" style={{ color: STATUS_COLOR[proof.status] }} />
                  <span
                    className="text-[10px] font-body px-2 py-0.5 rounded-full border"
                    style={{
                      color:       STATUS_COLOR[proof.status],
                      borderColor: `${STATUS_COLOR[proof.status]}35`,
                      background:  `${STATUS_COLOR[proof.status]}12`,
                    }}
                  >
                    {proof.status}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Monthly calendar ──────────────────────────────────────────────────────────

interface CalendarProps {
  year:         number
  month:        number             // 0-indexed
  allCompletions: Record<string, string[]>
  allProofs:    ProofEntry[]
  selected:     string | null
  onSelect:     (iso: string) => void
}

function Calendar({ year, month, allCompletions, allProofs, selected, onSelect }: CalendarProps) {
  const days    = new Date(year, month + 1, 0).getDate()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7  // Mon=0

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]

  const proofsByDate = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of allProofs) {
      if (p.status === 'approved' || p.status === 'uncertain') {
        map[p.date] = (map[p.date] ?? 0) + 1
      }
    }
    return map
  }, [allProofs])

  function cellIso(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function cellIntensity(iso: string): number {
    const proofCount = proofsByDate[iso] ?? 0
    const doneCount  = (allCompletions[iso] ?? []).length
    if (proofCount >= 3) return 4
    if (proofCount >= 2) return 3
    if (proofCount >= 1) return 2
    if (doneCount  >= 1) return 1
    return 0
  }

  const intensityStyle: Record<number, { bg: string; border: string }> = {
    0: { bg: 'transparent',  border: '#2a2a4a40' },
    1: { bg: '#d4a85314',    border: '#d4a85330' },
    2: { bg: '#d4a85328',    border: '#d4a85355' },
    3: { bg: '#3dbd7a22',    border: '#3dbd7a45' },
    4: { bg: '#3dbd7a38',    border: '#3dbd7a70' },
  }

  const today = isoToday()

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <p key={i} className="text-center text-[10px] text-muted/50 font-display py-1">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const iso = cellIso(d)
          const level = cellIntensity(iso)
          const isToday = iso === today
          const isSel   = iso === selected
          const style   = intensityStyle[level]
          return (
            <motion.button
              key={iso}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(iso)}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-body relative transition-all"
              style={{
                background:  isSel ? '#d4a85330' : style.bg,
                border:      `1px solid ${isSel ? '#d4a85380' : isToday ? '#d4a85355' : style.border}`,
                color:       level > 0 ? '#f0ece3' : '#9896b860',
              }}
            >
              {d}
              {level > 0 && (
                <div
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: level >= 3 ? '#3dbd7a' : '#d4a853' }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = 'daily' | 'monthly'

export default function ProofBankPage() {
  const router = useRouter()
  const [routine,        setRoutine]        = useState<GeneratedRoutine | null>(null)
  const [allProofs,      setAllProofs]      = useState<ProofEntry[]>([])
  const [allCompletions, setAllCompletions] = useState<Record<string, string[]>>({})
  const [view,           setView]           = useState<ViewMode>('daily')
  const [typeFilter,     setTypeFilter]     = useState<BlockType | null>(null)
  const [calMonth,       setCalMonth]       = useState(() => new Date().getMonth())
  const [calYear,        setCalYear]        = useState(() => new Date().getFullYear())
  const [selectedDate,   setSelectedDate]   = useState<string | null>(null)
  const [showFilter,     setShowFilter]     = useState(false)

  useEffect(() => {
    const r = loadRoutine()
    if (!r) { router.replace('/dashboard'); return }
    setRoutine(r)
    setAllProofs(loadProofs())
    setAllCompletions(getAllCompletions())
  }, [router])

  // All active dates (have completions or proofs), newest first, capped at 60 days
  const activeDates = useMemo(() => {
    const set = new Set([
      ...Object.keys(allCompletions),
      ...allProofs.map(p => p.date),
    ])
    return Array.from(set).sort().reverse().slice(0, 60)
  }, [allCompletions, allProofs])

  // Blocks scheduled for a given ISO date
  function blocksForDate(iso: string): RoutineBlock[] {
    if (!routine) return []
    const dow = DOW_MAP[new Date(iso + 'T12:00:00').getDay()]
    return routine.blocks
      .filter(b => b.days.includes(dow))
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  const monthName = new Date(calYear, calMonth, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function shiftMonth(dir: 1 | -1) {
    const d = new Date(calYear, calMonth + dir, 1)
    setCalYear(d.getFullYear())
    setCalMonth(d.getMonth())
    setSelectedDate(null)
  }

  // Stats summary
  const totalProofs    = allProofs.length
  const approvedProofs = allProofs.filter(p => p.status === 'approved').length
  const proofDays      = new Set(allProofs.map(p => p.date)).size

  if (!routine) return null

  return (
    <main className="min-h-screen bg-void text-text">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 0%, #0a0820 0%, transparent 50%)' }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-32">

        {/* Header */}
        <div className="flex items-center gap-3 pt-5 pb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-muted hover:text-text transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-text text-base tracking-wide">Proof Bank</h1>
            <p className="text-muted text-xs mt-0.5">
              {totalProofs} {totalProofs === 1 ? 'entry' : 'entries'} · {proofDays} {proofDays === 1 ? 'day' : 'days'} documented
            </p>
          </div>
          <button
            onClick={() => setShowFilter(v => !v)}
            className={`p-2 transition-colors ${showFilter ? 'text-gold' : 'text-muted hover:text-text'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Stats row */}
        {totalProofs > 0 && (
          <div className="flex gap-3 mb-5">
            {[
              { label: 'Submitted',  value: totalProofs },
              { label: 'Approved',   value: approvedProofs },
              { label: 'Days on record', value: proofDays },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 px-3 py-2.5 rounded-xl bg-surface/35 border border-border/40 text-center">
                <p className="text-text text-base font-display">{value}</p>
                <p className="text-muted/70 text-[10px] font-body mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter chips */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <p className="text-muted/60 text-[10px] font-body uppercase tracking-widest mb-2">Filter by type</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setTypeFilter(null)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-body transition-all ${
                    typeFilter === null
                      ? 'border-gold/45 bg-gold/12 text-gold'
                      : 'border-border text-muted hover:text-text'
                  }`}
                >
                  All
                </button>
                {(Object.keys(TYPE_LABELS) as BlockType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(prev => prev === t ? null : t)}
                    className="px-3 py-1.5 rounded-full border text-xs font-body transition-all"
                    style={typeFilter === t
                      ? { borderColor: `${TYPE_COLORS[t]}50`, background: `${TYPE_COLORS[t]}18`, color: TYPE_COLORS[t] }
                      : { borderColor: '#2a2a4a', color: '#9896b8' }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View tabs */}
        <div className="flex gap-1 mb-5 bg-surface/40 rounded-xl p-1">
          {(['daily', 'monthly'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wide transition-all capitalize ${
                v === view
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-muted hover:text-text/60'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* ── Daily view ── */}
        {view === 'daily' && (
          <>
            {activeDates.length === 0 && (
              <p className="text-center text-muted text-sm py-16 font-body">
                No activity yet. Complete a block and drop a proof to start your Bank.
              </p>
            )}
            {activeDates.map(date => (
              <DayCard
                key={date}
                date={date}
                blocks={blocksForDate(date)}
                completedIds={new Set(allCompletions[date] ?? [])}
                proofs={allProofs.filter(p => p.date === date)}
                typeFilter={typeFilter}
              />
            ))}
          </>
        )}

        {/* ── Monthly view ── */}
        {view === 'monthly' && (
          <>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => shiftMonth(-1)}
                className="w-8 h-8 rounded-lg border border-border/50 text-muted hover:text-text flex items-center justify-center transition-colors"
              >
                ‹
              </button>
              <p className="font-display text-text text-sm tracking-wide">{monthName}</p>
              <button
                onClick={() => shiftMonth(1)}
                className="w-8 h-8 rounded-lg border border-border/50 text-muted hover:text-text flex items-center justify-center transition-colors"
              >
                ›
              </button>
            </div>

            <Calendar
              year={calYear}
              month={calMonth}
              allCompletions={allCompletions}
              allProofs={allProofs}
              selected={selectedDate}
              onSelect={iso => setSelectedDate(prev => prev === iso ? null : iso)}
            />

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 px-1">
              <p className="text-muted/50 text-[10px] font-body">Less</p>
              {[0, 1, 2, 3, 4].map(l => (
                <div
                  key={l}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    background:  l === 0 ? 'transparent' : l <= 2 ? `#d4a853${l === 1 ? '20' : '40'}` : `#3dbd7a${l === 3 ? '35' : '60'}`,
                    border:      `1px solid ${l === 0 ? '#2a2a4a40' : l <= 2 ? '#d4a85355' : '#3dbd7a55'}`,
                  }}
                />
              ))}
              <p className="text-muted/50 text-[10px] font-body">More</p>
            </div>

            {/* Selected date detail */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-5"
                >
                  <DayCard
                    date={selectedDate}
                    blocks={blocksForDate(selectedDate)}
                    completedIds={new Set(allCompletions[selectedDate] ?? [])}
                    proofs={allProofs.filter(p => p.date === selectedDate)}
                    typeFilter={typeFilter}
                  />
                  {!allCompletions[selectedDate]?.length && !allProofs.some(p => p.date === selectedDate) && (
                    <p className="text-center text-muted/60 text-xs font-body py-4">No activity on this day.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </main>
  )
}
