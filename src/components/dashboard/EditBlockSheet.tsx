'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, Bell, BellOff } from 'lucide-react'
import type { BlockType, DayOfWeek, ElixirType, RoutineBlock } from '@/lib/types'
import { getDisabledNotifIds, setNotifDisabled } from '@/lib/storage'

// ── Config ────────────────────────────────────────────────────────────────────

const BLOCK_TYPES: { value: BlockType; label: string; color: string }[] = [
  { value: 'goal',    label: 'Goal',    color: '#d4a853' },
  { value: 'routine', label: 'Routine', color: '#8a9bb5' },
  { value: 'meal',    label: 'Meal',    color: '#3dbd7a' },
  { value: 'rest',    label: 'Rest',    color: '#c4c9e8' },
  { value: 'leisure', label: 'Leisure', color: '#7c6fff' },
]

const ELIXIRS: { value: ElixirType; color: string; label: string }[] = [
  { value: 'fire',      color: '#e05c2f', label: 'Fire'      },
  { value: 'celestial', color: '#d4a853', label: 'Celestial' },
  { value: 'iron',      color: '#8a9bb5', label: 'Iron'      },
  { value: 'storm',     color: '#7c6fff', label: 'Storm'     },
  { value: 'wisdom',    color: '#4a7fff', label: 'Wisdom'    },
  { value: 'bloom',     color: '#3dbd7a', label: 'Bloom'     },
  { value: 'moon',      color: '#c4c9e8', label: 'Moon'      },
]

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_CHAR: Record<DayOfWeek, string> = {
  mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S',
}
const DAY_FULL: Record<DayOfWeek, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  block: RoutineBlock | null   // null = creating a new block
  onSave:   (block: RoutineBlock) => void
  onDelete: (id: string) => void
  onClose:  () => void
}

export function EditBlockSheet({ block, onSave, onDelete, onClose }: Props) {
  const isNew = block === null

  const [name,     setName]     = useState(block?.name ?? '')
  const [type,     setType]     = useState<BlockType>(block?.type ?? 'goal')
  const [time,     setTime]     = useState(block?.time ?? '08:00')
  const [duration, setDuration] = useState(block?.duration ?? 30)
  const [days,     setDays]     = useState<DayOfWeek[]>(
    block?.days ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
  )
  const [elixir, setElixir] = useState<ElixirType | null>(block?.elixirType ?? null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(true)

  useEffect(() => {
    if (block?.id) {
      setNotifEnabled(!getDisabledNotifIds().has(block.id))
    }
  }, [block?.id])

  const typeColor = BLOCK_TYPES.find(t => t.value === type)?.color ?? '#d4a853'
  const canSave   = name.trim().length > 0 && days.length > 0

  function handleTypeChange(t: BlockType) {
    setType(t)
    if (t !== 'goal' && t !== 'routine') setElixir(null)
  }

  function toggleDay(day: DayOfWeek) {
    setDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    )
  }

  function handleSave() {
    if (!canSave) return
    const id = block?.id ?? (Date.now().toString(36) + Math.random().toString(36).slice(2))
    setNotifDisabled(id, !notifEnabled)
    onSave({
      id,
      name:             name.trim(),
      type,
      time,
      duration,
      days,
      elixirType:       (type === 'goal' || type === 'routine') ? elixir : null,
      goalCategory:     block?.goalCategory ?? null,
      description:      block?.description ?? '',
      verificationTier: block?.verificationTier ?? 1,
    })
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 270 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-deep border-t border-border/70 rounded-t-2xl max-w-lg mx-auto"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-border rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-4 border-b border-border/40">
          <p
            className="font-display text-[11px] tracking-[0.38em] uppercase"
            style={{ color: typeColor }}
          >
            {isNew ? 'New Block' : 'Edit Block'}
          </p>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div
          className="overflow-y-auto px-5 py-5 space-y-6"
          style={{ maxHeight: 'calc(90vh - 56px - 88px)' }}
        >

          {/* Name */}
          <div>
            <label className="text-muted text-xs font-body block mb-2">Block name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Morning Run"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body placeholder:text-muted/35 focus:outline-none focus:border-border/80 transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-muted text-xs font-body block mb-2">Type</label>
            <div className="flex gap-2 flex-wrap">
              {BLOCK_TYPES.map(({ value: t, label, color }) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className="px-3.5 py-1.5 rounded-full border text-xs font-body transition-all"
                  style={type === t
                    ? { borderColor: `${color}50`, background: `${color}18`, color }
                    : { borderColor: '#2a2a4a', color: '#9896b8' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time + Duration */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-muted text-xs font-body block mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body focus:outline-none focus:border-border/80 transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="flex-1">
              <label className="text-muted text-xs font-body block mb-2">Duration</label>
              <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden h-[46px]">
                <button
                  onClick={() => setDuration(d => Math.max(5, d - 5))}
                  className="w-10 h-full text-muted hover:text-text transition-colors text-xl leading-none flex items-center justify-center"
                >−</button>
                <span className="flex-1 text-center text-text text-xs font-body">
                  {duration >= 60
                    ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}`
                    : `${duration} min`}
                </span>
                <button
                  onClick={() => setDuration(d => Math.min(240, d + 5))}
                  className="w-10 h-full text-muted hover:text-text transition-colors text-xl leading-none flex items-center justify-center"
                >+</button>
              </div>
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="text-muted text-xs font-body block mb-2">Days</label>
            <div className="flex gap-1.5">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  title={DAY_FULL[day]}
                  className="flex-1 h-9 rounded-lg text-xs font-display transition-all"
                  style={days.includes(day)
                    ? { background: `${typeColor}1e`, border: `1px solid ${typeColor}45`, color: typeColor }
                    : { background: 'transparent', border: '1px solid #2a2a4a', color: '#9896b8' }}
                >
                  {DAY_CHAR[day]}
                </button>
              ))}
            </div>
            {days.length === 0 && (
              <p className="text-ember text-xs mt-1.5 font-body">Select at least one day</p>
            )}
          </div>

          {/* Elixir — goal / routine only */}
          {(type === 'goal' || type === 'routine') && (
            <div>
              <label className="text-muted text-xs font-body block mb-2">Elixir type</label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* None swatch */}
                <button
                  onClick={() => setElixir(null)}
                  title="None"
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-body transition-all"
                  style={elixir === null
                    ? { borderColor: '#9896b860', background: '#9896b820', color: '#9896b8' }
                    : { borderColor: '#2a2a4a', color: '#2a2a4a' }}
                >—</button>
                {ELIXIRS.map(({ value: et, color, label }) => (
                  <button
                    key={et}
                    onClick={() => setElixir(et)}
                    title={label}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{
                      background:  elixir === et ? color : `${color}28`,
                      border:      elixir === et ? `2px solid ${color}` : `1px solid ${color}38`,
                      boxShadow:   elixir === et ? `0 0 10px ${color}55` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              {notifEnabled
                ? <Bell    className="w-3.5 h-3.5 text-muted/60" />
                : <BellOff className="w-3.5 h-3.5 text-muted/40" />}
              <div>
                <p className="text-text text-xs font-body">Block reminders</p>
                <p className="text-muted/50 text-[10px] font-body mt-0.5">Notify me when this starts</p>
              </div>
            </div>
            <button
              onClick={() => setNotifEnabled(v => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${notifEnabled ? 'bg-gold/55' : 'bg-border/60'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${notifEnabled ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Delete */}
          {!isNew && (
            <div className="pb-2">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 text-muted/55 hover:text-ember transition-colors text-xs font-body"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete this block
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <p className="text-muted text-xs font-body">Remove this block?</p>
                  <button
                    onClick={() => onDelete(block!.id)}
                    className="text-ember text-xs font-body font-medium"
                  >Delete</button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-muted text-xs font-body"
                  >Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="px-5 pb-8 pt-3 border-t border-border/25">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-3.5 rounded-2xl text-sm font-display tracking-wide transition-all"
            style={canSave
              ? { background: `${typeColor}1e`, border: `1px solid ${typeColor}40`, color: typeColor }
              : { background: '#17172e', border: '1px solid #2a2a4a', color: '#9896b840' }}
          >
            {isNew ? 'Add Block' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </>
  )
}
