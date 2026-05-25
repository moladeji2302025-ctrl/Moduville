'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'
import type { ElixirType } from '@/lib/types'

const ELIXIR_COLORS: Record<ElixirType, string> = {
  fire:      '#e05c2f',
  celestial: '#d4a853',
  iron:      '#8a9bb5',
  storm:     '#7c6fff',
  wisdom:    '#4a7fff',
  bloom:     '#3dbd7a',
  moon:      '#c4c9e8',
}

interface Props {
  /** 0–1 */
  fillLevel: number
  dominantElixir: ElixirType | null
  height?: number
}

export function ElixirTank({ fillLevel, dominantElixir, height = 120 }: Props) {
  const uid = useId()
  const clamp  = Math.max(0, Math.min(1, fillLevel))
  const color  = dominantElixir ? ELIXIR_COLORS[dominantElixir] : '#2a2a4a'
  const innerH = height - 22
  const fillH  = innerH * clamp
  const fillY  = 12 + innerH - fillH

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <svg width="22" height={height} viewBox={`0 0 22 ${height}`} fill="none">
        <defs>
          <clipPath id={`tc-${uid}`}>
            <rect x="2" y="12" width="18" height={innerH} rx="3" />
          </clipPath>
          <filter id={`tg-${uid}`} x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Tube body */}
        <rect x="2" y="12" width="18" height={innerH} rx="3"
          fill="#0b0b1e" stroke="#252440" strokeWidth="1.2" />

        {/* Liquid fill */}
        {clamp > 0 && (
          <motion.rect
            x="2" width="18" rx="0"
            fill={color} opacity={0.78}
            clipPath={`url(#tc-${uid})`}
            filter={`url(#tg-${uid})`}
            initial={{ height: 0, y: 12 + innerH }}
            animate={{ height: fillH, y: fillY }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {/* Surface shimmer */}
        {clamp > 0.03 && (
          <motion.rect
            x="2" width="18" height="2"
            fill={color}
            clipPath={`url(#tc-${uid})`}
            initial={{ y: 12 + innerH, opacity: 0 }}
            animate={{ y: fillY, opacity: [0.4, 1, 0.4] }}
            transition={{
              y:       { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        )}

        {/* Cap stem */}
        <rect x="8" y="6" width="6" height="8" rx="1.5" fill="#2a2a4a" />
        {/* Cap top */}
        <rect x="7" y="3" width="8" height="5" rx="2" fill="#17172e" stroke="#2a2a4a" strokeWidth="1" />
        <rect x="9" y="1" width="4" height="4" rx="1" fill="#2a2a4a" />
      </svg>

      <span
        className="text-xs font-body tabular-nums"
        style={{ color: clamp > 0 ? color : '#2a2a4a' }}
      >
        {Math.round(clamp * 100)}%
      </span>
    </div>
  )
}
