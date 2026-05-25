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

export type CitizenType =
  | 'philosopher'
  | 'doctor'
  | 'lawyer'
  | 'builder'
  | 'healer'
  | 'scholar'
  | 'artist'

export interface CitizenLetter {
  id: string
  citizenType: CitizenType
  citizenName: string
  citizenTitle: string
  subject: string
  body: string
  date: string
  read: boolean
}

export type DragonStage = 'egg' | 'hatching' | 'baby' | 'adult'

export interface UserProfile {
  username: string
  isPublic: boolean
  email?: string
}

export type FriendStatus = 'none' | 'requested' | 'friends'

export interface GiftRecord {
  userId: string
  pack:   'small' | 'standard' | 'premium'
  date:   string
}

export interface SocialState {
  friendStatuses:     Record<string, FriendStatus>
  sentGifts:          GiftRecord[]
  sentEncouragements: string[]   // userIds
}

export interface RoutineTemplate {
  id:                 string
  title:              string
  subtitle:           string           // "Built for X"
  goalCategory:       GoalCategory
  creatorUsername:    string
  creatorNote:        string           // personal tip from the creator
  consultantScore:    number           // 1–10, AI-rated quality
  consultantReview:   string           // one-line verdict
  installCount:       number
  avgCompletionRate:  number           // 0–1
  elixirType:         ElixirType
  blocks:             RoutineBlock[]
}

export type ProofType   = 'social' | 'document' | 'video' | 'photo'
export type ProofStatus = 'approved' | 'rejected' | 'uncertain'

export interface ProofEntry {
  id: string
  blockId: string
  blockName: string
  date: string
  type: ProofType
  content: string        // URL for links; filename for files
  status: ProofStatus
  submittedAt: string
  note?: string
}
