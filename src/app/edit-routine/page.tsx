'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { ArrowLeft, Plus, List, Clock } from 'lucide-react'
import { loadRoutine, updateBlock, deleteBlock, addBlock, saveRoutine } from '@/lib/storage'
import { EditBlockSheet } from '@/components/dashboard/EditBlockSheet'
import type { BlockType, DayOfWeek, ElixirType, GeneratedRoutine, RoutineBlock } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire: '#e05c2f', celestial: '#d4a853', iron: '#8a9bb5',
  storm: '#7c6fff', wisdom: '#4a7fff', bloom: '#3dbd7a', moon: '#c4c9e8',
}
const TYPE_COLORS: Record<BlockType, string> = {
  goal: '#d4a853', routine: '#8a9bb5', meal: '#3dbd7a', rest: '#c4c9e8', leisure: '#7c6fff',
}
const TYPE_LABELS: Record<BlockType, string> = {
  goal: 'Goal', routine: 'Routine', meal: 'Meal', rest: 'Rest', leisure: 'Leisure',
}

function blockColor(b: RoutineBlock): string {
  return b.elixirType ? ELIXIR_COLORS[b.elixirType] : TYPE_COLORS[b.type]
}

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function formatDays(days: DayOfWeek[]): string {
  if (days.length === 7) return 'Daily'
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri']
  const isWeekdays = weekdays.every(d => days.includes(d as DayOfWeek)) && !days.some(d => ['sat', 'sun'].includes(d))
  if (isWeekdays) return 'Weekdays'
  const isWeekends = ['sat', 'sun'].every(d => days.includes(d as DayOfWeek)) && !days.some(d => weekdays.includes(d))
  if (isWeekends) return 'Weekends'
  const SHORT: Record<DayOfWeek, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
  }
  return ALL_DAYS.filter(d => days.includes(d)).map(d => SHORT[d]).join(' · ')
}

function calcWeeklyHours(blocks: RoutineBlock[]): number {
  return Math.round(blocks.reduce((s, b) => s + b.duration * b.days.length, 0) / 60 * 10) / 10
}

// ── Timeline constants ────────────────────────────────────────────────────────

const PX_PER_HOUR = 72
const PX_PER_MIN  = PX_PER_HOUR / 60
const DAY_START   = 5 * 60    // 5:00 AM in minutes from midnight
const DAY_END     = 23 * 60   // 11:00 PM
const TOTAL_HRS   = (DAY_END - DAY_START) / 60
const TIMELINE_H  = TOTAL_HRS * PX_PER_HOUR  // total px height of the grid

const HOUR_LABELS = Array.from({ length: TOTAL_HRS + 1 }, (_, i) => {
  const h = DAY_START / 60 + i
  return h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
})

function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return Math.max(0, (h * 60 + m - DAY_START) * PX_PER_MIN)
}

function snapMins(mins: number): number {
  return Math.round(mins / 15) * 15
}

function minsToTime(mins: number): string {
  const clamped = Math.max(DAY_START, Math.min(DAY_END - 15, snapMins(mins)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ── Draggable timeline block ──────────────────────────────────────────────────

function TimelineBlock({
  block,
  onEdit,
  onTimeChange,
}: {
  block: RoutineBlock
  onEdit: (b: RoutineBlock) => void
  onTimeChange: (id: string, newTime: string) => void
}) {
  const y       = useMotionValue(0)
  const [dragging, setDragging] = useState(false)
  const color   = blockColor(block)
  const topPx   = timeToY(block.time)
  const heightPx = Math.max(28, block.duration * PX_PER_MIN)

  const [h, mStr] = block.time.split(':')
  const startMins = parseInt(h) * 60 + parseInt(mStr)
  const minDragY  = (DAY_START - startMins) * PX_PER_MIN
  const maxDragY  = (DAY_END - 15 - startMins) * PX_PER_MIN - heightPx

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: minDragY, bottom: maxDragY }}
      dragElastic={0.04}
      dragMomentum={false}
      onDragStart={() => setDragging(true)}
      onDragEnd={(_, info) => {
        const newMins = startMins + info.offset.y / PX_PER_MIN
        y.set(0)
        setDragging(false)
        onTimeChange(block.id, minsToTime(newMins))
      }}
      onClick={() => { if (!dragging) onEdit(block) }}
      whileDrag={{ scale: 1.025 }}
      className="rounded-xl overflow-hidden select-none"
      style={{
        position: 'absolute',
        top:      topPx,
        left:     2,
        right:    2,
        height:   heightPx,
        y,
        zIndex:   dragging ? 30 : 10,
        background: `${color}1a`,
        border:     `1px solid ${color}45`,
        cursor:     dragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: color }} />
      <div className="pl-3 pt-1 pr-1">
        <p className="text-text text-[11px] font-display tracking-wide truncate leading-snug">{block.name}</p>
        {block.duration >= 20 && (
          <p className="text-muted/60 text-[9px] font-body leading-none">{block.time}</p>
        )}
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type EditTarget = RoutineBlock | 'new' | null
type ViewMode   = 'list' | 'timeline'

export default function EditRoutinePage() {
  const router  = useRouter()
  const [routine,  setRoutine]  = useState<GeneratedRoutine | null>(null)
  const [editing,  setEditing]  = useState<EditTarget>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    const r = loadRoutine()
    if (!r) { router.replace('/dashboard'); return }
    setRoutine(r)
  }, [router])

  if (!routine) return null

  const sorted      = [...routine.blocks].sort((a, b) => a.time.localeCompare(b.time))
  const weeklyHours = calcWeeklyHours(routine.blocks)

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSave(block: RoutineBlock) {
    const isNew = editing === 'new'
    if (isNew) {
      addBlock(block)
      setRoutine(r => r ? { ...r, blocks: [...r.blocks, block] } : r)
    } else {
      updateBlock(block)
      setRoutine(r => r ? { ...r, blocks: r.blocks.map(b => (b.id === block.id ? block : b)) } : r)
    }
    setEditing(null)
  }

  function handleDelete(id: string) {
    deleteBlock(id)
    setRoutine(r => r ? { ...r, blocks: r.blocks.filter(b => b.id !== id) } : r)
    setEditing(null)
  }

  function handleTimeChange(blockId: string, newTime: string) {
    setRoutine(r => {
      if (!r) return r
      const blocks = r.blocks.map(b => b.id === blockId ? { ...b, time: newTime } : b)
      const updated = { ...r, blocks }
      saveRoutine(updated)
      return updated
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-void text-text">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 20% 0%, #0a0820 0%, transparent 50%)' }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-32">

        {/* Header */}
        <div className="flex items-center gap-3 pt-5 pb-5">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-muted hover:text-text transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-text text-base tracking-wide">Edit Routine</h1>
            <p className="text-muted text-xs mt-0.5">
              {routine.blocks.length} blocks · {weeklyHours} hrs/week
            </p>
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-surface/60 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-text'}`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-gold/15 text-gold' : 'text-muted hover:text-text'}`}
              title="Timeline view"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── List view ── */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {sorted.map(block => {
                const color = blockColor(block)
                return (
                  <motion.button
                    key={block.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                    onClick={() => setEditing(block)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-surface/50 hover:bg-surface/70 hover:border-border/70 transition-all text-left"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}55` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-sm font-display tracking-wide truncate">{block.name}</p>
                      <p className="text-muted text-xs mt-0.5">
                        {block.time}
                        <span className="mx-1.5 opacity-40">·</span>
                        {block.duration >= 60
                          ? `${Math.floor(block.duration / 60)}h${block.duration % 60 > 0 ? ` ${block.duration % 60}m` : ''}`
                          : `${block.duration} min`}
                        <span className="mx-1.5 opacity-40">·</span>
                        {formatDays(block.days)}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-body px-2 py-0.5 rounded-full border flex-shrink-0"
                      style={{ borderColor: `${color}35`, color, background: `${color}10` }}
                    >
                      {TYPE_LABELS[block.type]}
                    </span>
                  </motion.button>
                )
              })}
            </AnimatePresence>
            {routine.blocks.length === 0 && (
              <p className="text-center text-muted text-sm py-16 font-body">No blocks yet. Add one below.</p>
            )}
          </div>
        )}

        {/* ── Timeline view ── */}
        {viewMode === 'timeline' && (
          <div>
            <p className="text-muted/50 text-[11px] font-body mb-3">
              Drag any block up or down to reschedule it. Tap to edit.
            </p>
            <div className="flex gap-0">
              {/* Hour labels */}
              <div className="flex-shrink-0 w-12 relative" style={{ height: TIMELINE_H }}>
                {HOUR_LABELS.map((label, i) => (
                  <div
                    key={label}
                    className="absolute right-2 text-muted/50 text-[9px] font-body leading-none"
                    style={{ top: i * PX_PER_HOUR - 5 }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Grid + blocks */}
              <div className="flex-1 relative" style={{ height: TIMELINE_H }}>
                {/* Hour grid lines */}
                {HOUR_LABELS.map((label, i) => (
                  <div
                    key={label}
                    className="absolute inset-x-0 border-t border-border/20"
                    style={{ top: i * PX_PER_HOUR }}
                  />
                ))}
                {/* Half-hour lines */}
                {HOUR_LABELS.slice(0, -1).map((label, i) => (
                  <div
                    key={`half-${label}`}
                    className="absolute inset-x-0 border-t border-border/10"
                    style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }}
                  />
                ))}

                {/* Blocks */}
                {sorted.map(block => (
                  <TimelineBlock
                    key={block.id}
                    block={block}
                    onEdit={setEditing}
                    onTimeChange={handleTimeChange}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Block FAB */}
      <div className="fixed bottom-8 inset-x-0 flex justify-center z-30">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-6 py-3 bg-void/90 border border-gold/35 rounded-full text-gold text-sm font-body hover:bg-gold/10 transition-all backdrop-blur-sm"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </motion.button>
      </div>

      {/* Edit / New sheet */}
      <AnimatePresence>
        {editing !== null && (
          <EditBlockSheet
            block={editing === 'new' ? null : editing}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
