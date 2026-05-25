'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GeneratedRoutine, RoutineBlock, UserGoal } from '@/lib/types'
import { RoadmapDetailSheet } from './RoadmapDetailSheet'

export type NodeState = 'completed' | 'active' | 'upcoming' | 'missed'

const X_FRACS = [0.22, 0.78]
const ROW_H   = 120
const NODE_D  = 64
const NODE_R  = NODE_D / 2
const LABEL_W = 110
const TOP_PAD = 52  // room for player character above first node

const EMOJI_MAP: [RegExp, string][] = [
  [/workout|gym|exercise|lift|strength|weights/i,    '🏋️'],
  [/run|jog|sprint|cardio/i,                         '🏃'],
  [/sleep|nap|bed/i,                                 '😴'],
  [/breakfast|lunch|dinner|meal|eat|food|cook|bake/i,'🍽️'],
  [/meditat|pray|spiritual|devotion|church/i,        '🧘'],
  [/work|business|client|meeting|deep work/i,        '💼'],
  [/study|learn|read|book|course|research/i,         '📚'],
  [/social|friend|family|call|connect|relationship/i,'👥'],
  [/creat|content|write|draw|design|art|record/i,    '🎨'],
  [/walk|outdoor|nature|hike|stroll/i,               '🚶'],
  [/plan|review|reflect|journal|strategize/i,        '📝'],
  [/shower|hygiene|groom|clean/i,                    '🚿'],
  [/stretch|yoga|flex|mobility/i,                    '🤸'],
  [/leisure|relax|chill|game|movie|fun|hobby/i,      '🎮'],
  [/coffee|tea|morning routine|wake/i,               '☕'],
  [/music|practice|instrument|guitar|piano/i,        '🎵'],
]

function getEmoji(block: RoutineBlock): string {
  const text = `${block.name} ${block.description}`
  for (const [pat, emoji] of EMOJI_MAP) {
    if (pat.test(text)) return emoji
  }
  const defaults: Record<string, string> = {
    goal: '⭐', meal: '🍽️', rest: '😴', leisure: '🎮', routine: '🔄',
  }
  return defaults[block.type] ?? '📌'
}

function getNodeState(block: RoutineBlock, completions: Set<string>, isToday: boolean): NodeState {
  if (completions.has(block.id)) return 'completed'
  if (!isToday) return 'upcoming'
  const now      = new Date()
  const nowMins  = now.getHours() * 60 + now.getMinutes()
  const [h, m]   = block.time.split(':').map(Number)
  const startMins = h * 60 + m
  const endMins   = startMins + block.duration
  if (nowMins >= startMins - 5 && nowMins < endMins) return 'active'
  if (nowMins >= endMins) return 'missed'
  return 'upcoming'
}

function PlayerCharacter({ celebrate }: { celebrate: boolean }) {
  return (
    <motion.div
      key={celebrate ? 'celebrate' : 'idle'}
      animate={celebrate
        ? { y: [0, -14, 0, -9, 0], scale: [1, 1.25, 1, 1.1, 1] }
        : { y: [0, -5, 0] }
      }
      transition={celebrate
        ? { duration: 0.7, times: [0, 0.2, 0.45, 0.7, 1] }
        : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
      }
      className="text-[30px] leading-none select-none"
    >
      🐉
    </motion.div>
  )
}

interface Props {
  blocks:          RoutineBlock[]
  completions:     Set<string>
  isToday:         boolean
  routine:         GeneratedRoutine
  goals:           UserGoal[]
  justCompletedId: string | null
  onToggle:        (id: string) => void
}

export function DailyRoadmap({
  blocks, completions, isToday, routine, goals, justCompletedId, onToggle,
}: Props) {
  const containerRef              = useRef<HTMLDivElement>(null)
  const [width, setWidth]         = useState(343)
  const [selected, setSelected]   = useState<RoutineBlock | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.getBoundingClientRect().width)
    update()
    const ob = new ResizeObserver(update)
    ob.observe(el)
    return () => ob.disconnect()
  }, [])

  const nodes = useMemo(() => blocks.map((block, i) => ({
    block,
    state: getNodeState(block, completions, isToday),
    cx:    Math.round(width * X_FRACS[i % 2]),
    cy:    TOP_PAD + NODE_R + i * ROW_H,
    emoji: getEmoji(block),
    isLeft: i % 2 === 0,
  })), [blocks, completions, isToday, width])

  const svgH = nodes.length > 0 ? nodes[nodes.length - 1].cy + NODE_R + 24 : TOP_PAD + NODE_D

  const pathD = useMemo(() => {
    if (nodes.length < 2) return ''
    let d = `M ${nodes[0].cx} ${nodes[0].cy}`
    for (let i = 1; i < nodes.length; i++) {
      const { cx: px, cy: py } = nodes[i - 1]
      const { cx, cy }         = nodes[i]
      const midY = (py + cy) / 2
      d += ` C ${px} ${midY}, ${cx} ${midY}, ${cx} ${cy}`
    }
    return d
  }, [nodes])

  const playerIdx = isToday
    ? (() => {
        const a = nodes.findIndex(n => n.state === 'active')
        return a !== -1 ? a : nodes.findIndex(n => n.state === 'upcoming')
      })()
    : -1

  if (blocks.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-sm font-body">No blocks scheduled for this day.</p>
      </div>
    )
  }

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        {/* Path SVG */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={svgH}
          style={{ overflow: 'visible' }}
        >
          <path
            d={pathD}
            fill="none"
            stroke="#252545"
            strokeWidth={3}
            strokeDasharray="7 5"
            strokeLinecap="round"
          />
        </svg>

        {/* Nodes */}
        <div style={{ height: svgH, position: 'relative' }}>
          {nodes.map(({ block, cx, cy, state, emoji, isLeft }, i) => {
            const nodeLeft = cx - NODE_R
            const nodeTop  = cy - NODE_R
            const isPlayer   = i === playerIdx
            const isJustDone = block.id === justCompletedId

            const borderColor =
              state === 'completed' ? '#d4a853'
              : state === 'active'  ? '#7c6fff'
              : state === 'missed'  ? '#e05c2f66'
              : '#2e2e52'

            const bgColor =
              state === 'completed' ? '#d4a85318'
              : state === 'active'  ? '#7c6fff14'
              : state === 'missed'  ? '#e05c2f0d'
              : '#0f0f28'

            const boxShadow =
              state === 'completed' ? '0 0 16px 3px #d4a85338'
              : state === 'active'  ? '0 0 20px 5px #7c6fff48'
              : 'none'

            const nameColor =
              state === 'completed' ? 'text-gold'
              : state === 'active'  ? 'text-text'
              : state === 'missed'  ? 'text-muted/45'
              : 'text-muted/65'

            const timeColor =
              state === 'active' ? 'text-storm/70' : 'text-muted/35'

            return (
              <div
                key={block.id}
                style={{ position: 'absolute', left: nodeLeft, top: nodeTop }}
              >
                {/* Player character */}
                {isPlayer && (
                  <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-20">
                    <PlayerCharacter celebrate={!!isJustDone} />
                  </div>
                )}

                {/* Active pulse ring */}
                {state === 'active' && (
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    animate={{ scale: [1, 1.45, 1], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      inset: -5, border: '2px solid #7c6fff70',
                      borderRadius: '50%', zIndex: 5,
                    }}
                  />
                )}

                {/* Node button */}
                <motion.button
                  onClick={() => setSelected(block)}
                  whileTap={{ scale: 0.86 }}
                  initial={{ scale: 0.55, opacity: 0 }}
                  animate={{ scale: 1, opacity: state === 'missed' ? 0.55 : 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 22 }}
                  style={{
                    width: NODE_D, height: NODE_D,
                    border: `2px solid ${borderColor}`,
                    background: bgColor,
                    borderRadius: '50%',
                    boxShadow,
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* Completed shimmer */}
                  {state === 'completed' && (
                    <motion.div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      animate={{ opacity: [0, 0.45, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
                      style={{ background: 'radial-gradient(circle, #d4a853bb 0%, transparent 70%)' }}
                    />
                  )}
                  <span
                    className="text-[22px] leading-none select-none relative z-10"
                    style={{ filter: state === 'missed' ? 'grayscale(0.65) brightness(0.65)' : 'none' }}
                  >
                    {emoji}
                  </span>
                </motion.button>

                {/* Label */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: LABEL_W,
                    ...(isLeft
                      ? { left: NODE_D + 10, textAlign: 'left' }
                      : { left: -(LABEL_W + 10), textAlign: 'right' }),
                  }}
                >
                  <p className={`text-[11px] font-display tracking-wide leading-snug line-clamp-2 ${nameColor}`}>
                    {block.name}
                  </p>
                  <p className={`text-[9px] font-body mt-0.5 ${timeColor}`}>{block.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <RoadmapDetailSheet
            block={selected}
            state={getNodeState(selected, completions, isToday)}
            isToday={isToday}
            routine={routine}
            goals={goals}
            alreadyDone={completions.has(selected.id)}
            onToggle={() => { onToggle(selected.id); setSelected(null) }}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
