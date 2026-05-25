'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UserGoal, GeneratedRoutine } from '@/lib/types'

interface Props {
  goals: UserGoal[]
  onComplete: (routine: GeneratedRoutine) => void
}

const MESSAGES = [
  'Reading your goals...',
  'Mapping what each goal needs from your week...',
  'Building your Weekly Rhythm...',
  'Balancing deep work, rest, and real life...',
  'Preparing your Consultant...',
]
const SLOW_MSG = 'Almost there — your routine is complex. A few more seconds...'

export function StepProcessing({ goals, onComplete }: Props) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [slow,     setSlow]     = useState(false)
  const [error, setError] = useState<string | null>(null)
  const called = useRef(false)

  // Cycle through progress messages
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1))
    }, 1900)
    return () => clearInterval(id)
  }, [])

  // After 25s show a reassurance message instead of a blank wait
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 25_000)
    return () => clearTimeout(id)
  }, [])

  // Generate the routine (guarded against React Strict Mode double-invoke)
  useEffect(() => {
    if (called.current) return
    called.current = true

    fetch('/api/generate-routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Generation failed')
        return res.json()
      })
      .then(({ routine }) => onComplete(routine))
      .catch(err => {
        console.error(err)
        setError('Something went wrong generating your routine. Please check your API key and try again.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-ember/80 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 border border-border text-muted rounded-lg text-sm hover:border-muted/50 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      {/* Animated ring */}
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border-t-2 border-gold/70"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gold/60 animate-pulse" />
        </div>
      </div>

      {/* Cycling message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={slow ? 'slow' : msgIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4 }}
          className="text-muted text-sm text-center max-w-xs"
        >
          {slow ? SLOW_MSG : MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
