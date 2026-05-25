'use client'

import { Reorder, useDragControls, motion } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import type { ElixirType, RoutineBlock } from '@/lib/types'

const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire: '#e05c2f', celestial: '#d4a853', iron: '#8a9bb5',
  storm: '#7c6fff', wisdom: '#4a7fff', bloom: '#3dbd7a', moon: '#c4c9e8',
}

function nowMins(): number {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

function isMissed(block: RoutineBlock, completions: Set<string>): boolean {
  if (completions.has(block.id)) return false
  const [h, m] = block.time.split(':').map(Number)
  return nowMins() > h * 60 + m + block.duration
}

// ── Single draggable item ─────────────────────────────────────────────────────

interface ItemProps {
  block: RoutineBlock
  done: boolean
  missed: boolean
  isToday: boolean
  dimmed: boolean
  isMvdFocus: boolean
  onBlockClick: () => void
  onToggle: () => void
}

function DragItem({ block, done, missed, isToday, dimmed, isMvdFocus, onBlockClick, onToggle }: ItemProps) {
  const controls = useDragControls()
  const color    = block.elixirType ? ELIXIR_COLORS[block.elixirType] : '#2a2a4a'
  const dotColor = missed ? '#e05c2f' : color

  const card = (
    <div
      className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 select-none ${
        dimmed ? 'opacity-25 pointer-events-none'
        : done  ? 'bg-surface/15 border-border/20 opacity-50 cursor-pointer'
        : missed ? 'bg-ember/5 border-ember/25 cursor-pointer'
        : 'bg-surface/55 border-border hover:border-border/70 hover:bg-surface/70 cursor-pointer'
      } ${isMvdFocus ? 'ring-1 ring-gold/30' : ''}`}
      onClick={() => !dimmed && onBlockClick()}
    >
      {isToday && (
        <div
          onPointerDown={e => { e.stopPropagation(); controls.start(e) }}
          className="text-muted/25 hover:text-muted/55 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 py-1 -ml-0.5"
        >
          <GripVertical className="w-3 h-3" />
        </div>
      )}

      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: dotColor, boxShadow: `0 0 5px ${dotColor}55` }}
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-display tracking-wide truncate ${done ? 'line-through text-muted' : 'text-text'}`}>
          {block.name}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {block.time} · {block.duration >= 60
            ? `${Math.floor(block.duration / 60)}h${block.duration % 60 > 0 ? ` ${block.duration % 60}m` : ''}`
            : `${block.duration} min`}
          {missed && <span className="text-ember/65 ml-1.5">· Reschedule?</span>}
        </p>
      </div>

      {isToday && !dimmed && (
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            done
              ? 'border-gold/40 bg-gold/18 text-gold'
              : 'border-border hover:border-gold/35 text-transparent hover:text-gold/35'
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )

  if (!isToday) {
    return <motion.div layout>{card}</motion.div>
  }

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      style={{ listStyle: 'none' }}
      whileDrag={{ scale: 1.025, opacity: 0.92, zIndex: 50, position: 'relative' }}
      transition={{ duration: 0.12 }}
    >
      {card}
    </Reorder.Item>
  )
}

// ── List ──────────────────────────────────────────────────────────────────────

interface Props {
  blocks: RoutineBlock[]
  completions: Set<string>
  isToday: boolean
  mvdActive: boolean
  mvdBlock: RoutineBlock | null
  onReorder: (newBlocks: RoutineBlock[]) => void
  onBlockClick: (block: RoutineBlock) => void
  onToggle: (blockId: string) => void
}

export function DraggableBlockList({
  blocks, completions, isToday, mvdActive, mvdBlock,
  onReorder, onBlockClick, onToggle,
}: Props) {
  if (blocks.length === 0) {
    return (
      <p className="text-center text-muted text-sm py-12 font-body">
        Rest day — no blocks scheduled.
      </p>
    )
  }

  const items = blocks.map(block => ({
    block,
    done:       completions.has(block.id),
    missed:     isToday && isMissed(block, completions),
    dimmed:     mvdActive && isToday && block.id !== mvdBlock?.id,
    isMvdFocus: mvdActive && isToday && block.id === mvdBlock?.id,
  }))

  if (!isToday) {
    return (
      <div className="space-y-2">
        {items.map(({ block, done, missed, dimmed, isMvdFocus }) => (
          <DragItem key={block.id} block={block} done={done} missed={missed}
            isToday={false} dimmed={dimmed} isMvdFocus={isMvdFocus}
            onBlockClick={() => onBlockClick(block)} onToggle={() => onToggle(block.id)} />
        ))}
      </div>
    )
  }

  return (
    <Reorder.Group
      axis="y"
      values={blocks}
      onReorder={onReorder}
      style={{ listStyle: 'none', padding: 0, margin: 0 }}
      className="space-y-2"
    >
      {items.map(({ block, done, missed, dimmed, isMvdFocus }) => (
        <DragItem key={block.id} block={block} done={done} missed={missed}
          isToday={true} dimmed={dimmed} isMvdFocus={isMvdFocus}
          onBlockClick={() => onBlockClick(block)} onToggle={() => onToggle(block.id)} />
      ))}
    </Reorder.Group>
  )
}
