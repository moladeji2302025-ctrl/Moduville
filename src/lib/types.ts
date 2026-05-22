export type GoalCategory =
  | 'fitness'
  | 'spiritual'
  | 'business'
  | 'creative'
  | 'relationships'
  | 'learning'
  | 'health'
  | 'other'

export type ElixirType =
  | 'fire'      // Workout/Fitness → red-orange
  | 'celestial' // Spiritual → gold-white
  | 'iron'      // Business/Deep Work → dark silver
  | 'storm'     // Creative/Content → purple-white
  | 'wisdom'    // Study/Learning → deep blue
  | 'bloom'     // Social/Relationships → green
  | 'moon'      // Sleep/Rest → silver

export type BlockType = 'goal' | 'meal' | 'rest' | 'leisure' | 'routine'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type VerificationTier = 1 | 2 | 3 | 4

export interface UserGoal {
  id: string
  text: string
  category: GoalCategory
}

export interface RoutineBlock {
  id: string
  name: string
  type: BlockType
  elixirType: ElixirType | null
  goalCategory: GoalCategory | null
  duration: number
  time: string
  days: DayOfWeek[]
  description: string
  verificationTier: VerificationTier
}

export interface GeneratedRoutine {
  summary: string
  totalWeeklyHours: number
  goalMapping: Record<string, string[]>
  blocks: RoutineBlock[]
}

export interface ConsultantMessage {
  role: 'user' | 'assistant'
  content: string
}

export type OnboardingStep =
  | 'welcome'
  | 'goals'
  | 'processing'
  | 'consultant'
  | 'review'
  | 'reveal'
