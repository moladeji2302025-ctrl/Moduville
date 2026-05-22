'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StepWelcome } from '@/components/onboarding/StepWelcome'
import { StepGoalInput } from '@/components/onboarding/StepGoalInput'
import { StepProcessing } from '@/components/onboarding/StepProcessing'
import { StepConsultant } from '@/components/onboarding/StepConsultant'
import { StepRoutineReview } from '@/components/onboarding/StepRoutineReview'
import { StepDragonReveal } from '@/components/onboarding/StepDragonReveal'
import type { UserGoal, GeneratedRoutine, OnboardingStep } from '@/lib/types'

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'goals',
  'processing',
  'consultant',
  'review',
  'reveal',
]

const STEP_VARIANTS = {
  initial: { opacity: 0, y: 18 },
  enter:   { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -18 },
}

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [goals, setGoals] = useState<UserGoal[]>([])
  const [routine, setRoutine] = useState<GeneratedRoutine | null>(null)

  const stepIndex = STEP_ORDER.indexOf(step)

  return (
    <main className="min-h-screen bg-void relative">
      {/* Subtle background atmosphere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 15% 90%, #0a0820 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 88% 10%, #0a0d22 0%, transparent 55%)',
        }}
      />

      {/* Progress dots */}
      {step !== 'reveal' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
          {STEP_ORDER.filter(s => s !== 'reveal').map((s, i) => (
            <div
              key={s}
              className={`rounded-full transition-all duration-500 ${
                i < stepIndex
                  ? 'w-2 h-2 bg-gold/60'
                  : i === stepIndex
                  ? 'w-5 h-2 bg-gold'
                  : 'w-2 h-2 bg-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            variants={STEP_VARIANTS}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <StepWelcome onContinue={() => setStep('goals')} />
          </motion.div>
        )}

        {step === 'goals' && (
          <motion.div
            key="goals"
            variants={STEP_VARIANTS}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <StepGoalInput
              onContinue={g => {
                setGoals(g)
                setStep('processing')
              }}
            />
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            variants={STEP_VARIANTS}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <StepProcessing
              goals={goals}
              onComplete={r => {
                setRoutine(r)
                setStep('consultant')
              }}
            />
          </motion.div>
        )}

        {step === 'consultant' && routine && (
          <motion.div
            key="consultant"
            variants={STEP_VARIANTS}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="h-screen"
          >
            <StepConsultant
              goals={goals}
              routine={routine}
              onComplete={() => setStep('review')}
            />
          </motion.div>
        )}

        {step === 'review' && routine && (
          <motion.div
            key="review"
            variants={STEP_VARIANTS}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="h-screen"
          >
            <StepRoutineReview
              routine={routine}
              onContinue={() => setStep('reveal')}
            />
          </motion.div>
        )}

        {step === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <StepDragonReveal />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
