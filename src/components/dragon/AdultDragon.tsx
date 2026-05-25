'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'

interface Props {
  size?: number
  color?: string
  warmth?: number
}

export function AdultDragon({ size = 100, color = '#7c6fff', warmth = 0.5 }: Props) {
  const uid = useId()
  // viewBox is 120x100 — wider to accommodate spread wings
  const w = size
  const h = Math.round(size * (100 / 120))

  return (
    <motion.div
      style={{ width: w, height: h }}
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 120 100" width={w} height={h} overflow="visible">
        <defs>
          <radialGradient id={`${uid}-halo`} cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity={String(Math.round(0.4 * warmth * 100) / 100)} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-chest`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e05c2f" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e05c2f" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-glow-soft`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Ambient halo */}
        <ellipse cx="60" cy="65" rx="52" ry="40" fill={`url(#${uid}-halo)`} />

        {/* ── Left wing ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '36px 66px' }}
          animate={{ rotate: [0, 4, 0, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Wing membrane */}
          <path
            d="M 36,66 C 20,56 5,38 8,14 L 18,20 C 22,38 28,54 34,64 Z"
            fill={`${color}38`}
            stroke={`${color}50`}
            strokeWidth="0.6"
          />
          {/* Wing bone — outer */}
          <path d="M 36,66 C 18,52 8,32 10,14" stroke={`${color}60`} strokeWidth="1.2" fill="none" />
          {/* Wing bone — middle finger */}
          <path d="M 36,66 C 22,54 20,36 20,20" stroke={`${color}45`} strokeWidth="0.8" fill="none" />
          {/* Wing membrane highlight */}
          <path
            d="M 36,66 C 20,56 5,38 8,14 L 18,20 C 22,38 28,54 34,64 Z"
            fill="white" opacity="0.04"
          />
        </motion.g>

        {/* ── Right wing ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '84px 66px' }}
          animate={{ rotate: [0, -4, 0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Wing membrane */}
          <path
            d="M 84,66 C 100,56 115,38 112,14 L 102,20 C 98,38 92,54 86,64 Z"
            fill={`${color}38`}
            stroke={`${color}50`}
            strokeWidth="0.6"
          />
          {/* Wing bone — outer */}
          <path d="M 84,66 C 102,52 112,32 110,14" stroke={`${color}60`} strokeWidth="1.2" fill="none" />
          {/* Wing bone — middle finger */}
          <path d="M 84,66 C 98,54 100,36 100,20" stroke={`${color}45`} strokeWidth="0.8" fill="none" />
          <path
            d="M 84,66 C 100,56 115,38 112,14 L 102,20 C 98,38 92,54 86,64 Z"
            fill="white" opacity="0.04"
          />
        </motion.g>

        {/* ── Tail ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50px 82px' }}
          animate={{ rotate: [0, 5, 0, -3, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 75,84 C 90,90 98,78 96,66 C 94,57 84,54 80,63"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 75,84 C 90,90 98,78 96,66 C 94,57 84,54 80,63"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.08"
          />
          {/* Tail spike */}
          <polygon points="79,62 74,54 85,56" fill={color} />
        </motion.g>

        {/* ── Body ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '60px 75px' }}
          animate={{ scaleY: [1, 1.025, 1] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="60" cy="75" rx="19" ry="15" fill={color} />
          <ellipse cx="55" cy="66" rx="7" ry="4.5" fill="white" opacity="0.07" />
        </motion.g>

        {/* Back spines (visible above body) */}
        <polygon points="46,58 41,48 51,52" fill={color} opacity="0.75" />
        <polygon points="60,55 57,44 63,49" fill={color} opacity="0.9" />
        <polygon points="74,58 79,48 69,52" fill={color} opacity="0.75" />

        {/* Belly */}
        <ellipse cx="60" cy="78" rx="12" ry="10" fill={`${color}45`} />

        {/* Chest glow */}
        <motion.ellipse
          cx="60" cy="74" rx="11" ry="9"
          fill="url(#a-chest)"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.ellipse
          cx="60" cy="74" rx="11" ry="9"
          fill="#e05c2f"
          opacity="0.18"
          filter={`url(#${uid}-glow-soft)`}
          animate={{ opacity: [0.1, 0.28, 0.1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        {/* Neck */}
        <ellipse cx="60" cy="59" rx="12" ry="9" fill={color} />

        {/* ── Head ── */}
        <ellipse cx="60" cy="42" rx="14" ry="13" fill={color} />
        <ellipse cx="55" cy="35" rx="5" ry="3" fill="white" opacity="0.07" />

        {/* Snout */}
        <ellipse cx="60" cy="52" rx="9" ry="5" fill={color} />

        {/* Brow ridges (angular / fierce) */}
        <path d="M 50,36 L 53.5,30 L 57,35" stroke={`${color}dd`} strokeWidth="1.8"
          fill="none" strokeLinejoin="round" />
        <path d="M 70,36 L 66.5,30 L 63,35" stroke={`${color}dd`} strokeWidth="1.8"
          fill="none" strokeLinejoin="round" />

        {/* Left eye — fierce elongated */}
        <ellipse cx="53" cy="37" rx="5.2" ry="3.5" fill="white" opacity="0.92" />
        <ellipse cx="53" cy="37" rx="4.5" ry="3" fill={color} />
        {/* Left pupil — vertical slit */}
        <ellipse cx="53" cy="37" rx="1.3" ry="2.8" fill="#0a0918" />
        <circle cx="55" cy="35.2" r="1" fill="white" opacity="0.85" />
        {/* Left eye glow */}
        <motion.ellipse
          cx="53" cy="37" rx="6" ry="4"
          fill="none" stroke={color} strokeWidth="1.3"
          filter={`url(#${uid}-glow)`}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        />

        {/* Right eye */}
        <ellipse cx="67" cy="37" rx="5.2" ry="3.5" fill="white" opacity="0.92" />
        <ellipse cx="67" cy="37" rx="4.5" ry="3" fill={color} />
        <ellipse cx="67" cy="37" rx="1.3" ry="2.8" fill="#0a0918" />
        <circle cx="69" cy="35.2" r="1" fill="white" opacity="0.85" />
        <motion.ellipse
          cx="67" cy="37" rx="6" ry="4"
          fill="none" stroke={color} strokeWidth="1.3"
          filter={`url(#${uid}-glow)`}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: 0.4 }}
        />

        {/* Nostrils */}
        <ellipse cx="56.5" cy="54.5" rx="1.4" ry="1" fill="#0a0918" opacity="0.6" />
        <ellipse cx="63.5" cy="54.5" rx="1.4" ry="1" fill="#0a0918" opacity="0.6" />

        {/* ── Horns ── */}
        {/* Main left */}
        <polygon points="52,30 46,13 57,22" fill={color} />
        <polygon points="52,30 46,13 57,22" fill="white" opacity="0.09" />
        {/* Main right */}
        <polygon points="68,30 74,13 63,22" fill={color} />
        <polygon points="68,30 74,13 63,22" fill="white" opacity="0.09" />
        {/* Center crest */}
        <polygon points="60,28 57,16 63,22" fill={color} opacity="0.85" />

        {/* Horn glow */}
        <motion.polygon
          points="52,30 46,13 57,22"
          fill="none" stroke={color} strokeWidth="0.8"
          filter={`url(#${uid}-glow)`}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity }}
        />
        <motion.polygon
          points="68,30 74,13 63,22"
          fill="none" stroke={color} strokeWidth="0.8"
          filter={`url(#${uid}-glow)`}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
        />
      </svg>
    </motion.div>
  )
}
