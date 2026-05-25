'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'

interface Props {
  size?: number
  color?: string
  warmth?: number
}

export function BabyDragon({ size = 100, color = '#7c6fff', warmth = 0.5 }: Props) {
  const uid = useId()
  const w = size
  const h = Math.round(size * 1.1)

  return (
    <motion.div
      style={{ width: w, height: h }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 80 88" width={w} height={h} overflow="visible">
        <defs>
          <radialGradient id={`${uid}-halo`} cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity={String(Math.round(0.35 * warmth * 100) / 100)} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient halo */}
        <ellipse cx="40" cy="54" rx="38" ry="32" fill={`url(#${uid}-halo)`} />

        {/* ── Left wing (behind body) ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '23px 57px' }}
          animate={{ rotate: [0, 5, 0, -3, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 23,57 C 8,50 4,34 11,22 C 17,36 20,50 25,57 Z"
            fill={`${color}42`}
            stroke={`${color}55`}
            strokeWidth="0.5"
          />
          <path d="M 23,57 C 14,44 13,30 15,22" stroke={`${color}45`} strokeWidth="0.7" fill="none" />
        </motion.g>

        {/* ── Right wing (behind body) ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '57px 57px' }}
          animate={{ rotate: [0, -5, 0, 3, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 57,57 C 72,50 76,34 69,22 C 63,36 60,50 55,57 Z"
            fill={`${color}42`}
            stroke={`${color}55`}
            strokeWidth="0.5"
          />
          <path d="M 57,57 C 66,44 67,30 65,22" stroke={`${color}45`} strokeWidth="0.7" fill="none" />
        </motion.g>

        {/* ── Tail ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '44px 74px' }}
          animate={{ rotate: [0, 7, 0, -5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M 56,73 C 67,78 73,70 73,61 C 73,53 65,52 61,57"
            stroke={color}
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 56,73 C 67,78 73,70 73,61 C 73,53 65,52 61,57"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.09"
          />
        </motion.g>

        {/* ── Body ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '40px 65px' }}
          animate={{ scaleY: [1, 1.03, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="40" cy="65" rx="21" ry="17" fill={color} />
          <ellipse cx="35" cy="57" rx="7" ry="5" fill="white" opacity="0.07" />
        </motion.g>

        {/* Belly */}
        <ellipse cx="40" cy="69" rx="12" ry="10" fill={`${color}48`} />

        {/* Neck */}
        <ellipse cx="40" cy="50" rx="10" ry="8" fill={color} />

        {/* ── Head (animated nod) ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '40px 34px' }}
          animate={{ rotate: [0, -3, 0, 2.5, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Head */}
          <circle cx="40" cy="34" r="16" fill={color} />
          <ellipse cx="35" cy="27" rx="5.5" ry="3.5" fill="white" opacity="0.07" />

          {/* Left horn */}
          <polygon points="31,22 26,10 38,18" fill={color} />
          <polygon points="31,22 26,10 38,18" fill="white" opacity="0.10" />

          {/* Right horn */}
          <polygon points="49,22 54,10 42,18" fill={color} />
          <polygon points="49,22 54,10 42,18" fill="white" opacity="0.10" />

          {/* Snout */}
          <ellipse cx="40" cy="46" rx="7" ry="4.5" fill={color} />

          {/* Left eye — sclera */}
          <circle cx="33" cy="30" r="6.2" fill="white" opacity="0.94" />
          {/* Left iris */}
          <circle cx="33" cy="31" r="3.8" fill={color} />
          {/* Left pupil — blinking */}
          <motion.circle
            cx="33" cy="31" r="2.5"
            fill="#0d0c20"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
            transition={{ duration: 5.5, repeat: Infinity, times: [0, 0.44, 0.5, 0.56, 1] }}
          />
          {/* Left eye highlight */}
          <circle cx="35" cy="28.8" r="1.2" fill="white" opacity="0.9" />
          {/* Left eye glow */}
          <motion.circle
            cx="33" cy="30" r="7"
            fill="none" stroke={color} strokeWidth="1.2"
            filter={`url(#${uid}-glow)`}
            animate={{ opacity: [0.25, 0.75, 0.25] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          />

          {/* Right eye — sclera */}
          <circle cx="47" cy="30" r="6.2" fill="white" opacity="0.94" />
          {/* Right iris */}
          <circle cx="47" cy="31" r="3.8" fill={color} />
          {/* Right pupil — blinking */}
          <motion.circle
            cx="47" cy="31" r="2.5"
            fill="#0d0c20"
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
            transition={{ duration: 5.5, repeat: Infinity, times: [0, 0.44, 0.5, 0.56, 1] }}
          />
          {/* Right eye highlight */}
          <circle cx="49" cy="28.8" r="1.2" fill="white" opacity="0.9" />
          {/* Right eye glow */}
          <motion.circle
            cx="47" cy="30" r="7"
            fill="none" stroke={color} strokeWidth="1.2"
            filter={`url(#${uid}-glow)`}
            animate={{ opacity: [0.25, 0.75, 0.25] }}
            transition={{ duration: 3.2, repeat: Infinity, delay: 0.6 }}
          />

          {/* Nostrils */}
          <ellipse cx="37.5" cy="48.5" rx="1.2" ry="0.9" fill="#0d0c20" opacity="0.5" />
          <ellipse cx="42.5" cy="48.5" rx="1.2" ry="0.9" fill="#0d0c20" opacity="0.5" />

          {/* Smile */}
          <path d="M 36,51.5 Q 40,55 44,51.5" stroke="#0d0c20" strokeWidth="0.9"
            fill="none" strokeLinecap="round" opacity="0.4" />
        </motion.g>
      </svg>
    </motion.div>
  )
}
