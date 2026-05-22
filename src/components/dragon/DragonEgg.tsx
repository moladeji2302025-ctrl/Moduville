'use client'

import { motion } from 'framer-motion'

interface DragonEggProps {
  size?: number
  glowColor?: string
  /** 0–1: how "alive" the egg feels. 0 = cold/dormant, 1 = warm/hatching */
  warmth?: number
  float?: boolean
}

export function DragonEgg({
  size = 220,
  glowColor = '#d4a853',
  warmth = 0,
  float = true,
}: DragonEggProps) {
  const height = size * 1.25
  const glowOpacity = 0.04 + warmth * 0.14
  const crackOpacity = 0.1 + warmth * 0.25
  const innerGlowOpacity = 0.025 + warmth * 0.08

  return (
    <motion.div
      animate={float ? { y: [0, -12, 0] } : {}}
      transition={
        float
          ? { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          : {}
      }
      style={{ width: size, height }}
    >
      <svg
        width={size}
        height={height}
        viewBox="0 0 200 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main body gradient */}
          <radialGradient id="egg-body" cx="38%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#1c1a38" />
            <stop offset="55%" stopColor="#0e0d22" />
            <stop offset="100%" stopColor="#07071a" />
          </radialGradient>

          {/* Outer aura blur */}
          <filter id="aura" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
          </filter>

          {/* Inner warmth glow */}
          <filter id="inner-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer aura */}
        <ellipse
          cx="100"
          cy="130"
          rx="70"
          ry="96"
          fill={glowColor}
          opacity={glowOpacity}
          filter="url(#aura)"
        />
        <motion.ellipse
          cx="100"
          cy="130"
          rx="68"
          ry="94"
          fill={glowColor}
          opacity={glowOpacity * 0.6}
          filter="url(#aura)"
          animate={{ opacity: [glowOpacity * 0.4, glowOpacity * 1.1, glowOpacity * 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Egg body */}
        <path
          d="M100 22 C56 22, 30 76, 30 138 C30 194, 60 240, 100 240 C140 240, 170 194, 170 138 C170 76, 144 22, 100 22 Z"
          fill="url(#egg-body)"
        />

        {/* Scale arcs — top cluster */}
        <path d="M80 52 Q100 42 120 52" stroke="#1e1c3c" strokeWidth="0.9" fill="none" />
        {/* Row 2 */}
        <path d="M64 76 Q81 66 98 76" stroke="#1e1c3c" strokeWidth="0.85" fill="none" />
        <path d="M102 76 Q119 66 136 76" stroke="#1e1c3c" strokeWidth="0.85" fill="none" />
        {/* Row 3 */}
        <path d="M50 104 Q66 94 82 104" stroke="#1e1c3c" strokeWidth="0.75" fill="none" />
        <path d="M85 104 Q100 94 115 104" stroke="#1e1c3c" strokeWidth="0.75" fill="none" />
        <path d="M118 104 Q134 94 150 104" stroke="#1e1c3c" strokeWidth="0.75" fill="none" />
        {/* Row 4 */}
        <path d="M42 134 Q57 124 72 134" stroke="#1e1c3c" strokeWidth="0.65" fill="none" />
        <path d="M75 134 Q90 124 105 134" stroke="#1e1c3c" strokeWidth="0.65" fill="none" />
        <path d="M108 134 Q123 124 138 134" stroke="#1e1c3c" strokeWidth="0.65" fill="none" />
        <path d="M141 134 Q154 124 165 134" stroke="#1e1c3c" strokeWidth="0.65" fill="none" />
        {/* Row 5 */}
        <path d="M48 164 Q62 154 76 164" stroke="#1e1c3c" strokeWidth="0.55" fill="none" />
        <path d="M80 164 Q94 154 108 164" stroke="#1e1c3c" strokeWidth="0.55" fill="none" />
        <path d="M112 164 Q125 154 138 164" stroke="#1e1c3c" strokeWidth="0.55" fill="none" />
        {/* Row 6 */}
        <path d="M63 193 Q75 184 87 193" stroke="#1e1c3c" strokeWidth="0.45" fill="none" />
        <path d="M91 193 Q102 184 113 193" stroke="#1e1c3c" strokeWidth="0.45" fill="none" />
        <path d="M117 193 Q128 184 140 193" stroke="#1e1c3c" strokeWidth="0.45" fill="none" />

        {/* Dormant crack lines */}
        <path
          d="M100 58 L96 74 L103 87 L98 105"
          stroke={glowColor}
          strokeWidth="0.6"
          fill="none"
          opacity={crackOpacity}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M136 108 L126 121 L131 133"
          stroke={glowColor}
          strokeWidth="0.45"
          fill="none"
          opacity={crackOpacity * 0.7}
          strokeLinecap="round"
        />

        {/* Inner warmth glow (faint heartbeat) */}
        <ellipse
          cx="100"
          cy="138"
          rx="34"
          ry="46"
          fill={glowColor}
          opacity={innerGlowOpacity}
          filter="url(#inner-glow)"
        />

        {/* Surface highlight — top-left sheen */}
        <ellipse
          cx="74"
          cy="88"
          rx="20"
          ry="30"
          fill="white"
          opacity="0.028"
          transform="rotate(-18 74 88)"
        />

        {/* Outer border ring */}
        <path
          d="M100 22 C56 22, 30 76, 30 138 C30 194, 60 240, 100 240 C140 240, 170 194, 170 138 C170 76, 144 22, 100 22 Z"
          stroke={glowColor}
          strokeWidth="0.7"
          fill="none"
          opacity="0.22"
        />
      </svg>
    </motion.div>
  )
}
