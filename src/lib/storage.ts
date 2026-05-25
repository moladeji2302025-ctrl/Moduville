import type { CitizenLetter, DayOfWeek, DragonStage, FriendStatus, GeneratedRoutine, GiftRecord, ProofEntry, SocialState, UserGoal, UserProfile } from './types'

const ROUTINE_KEY      = 'moduville_routine'
const GOALS_KEY        = 'moduville_goals'
const COMPLETIONS_KEY  = 'moduville_completions'
const LETTERS_KEY      = 'moduville_letters'
const DRAGON_STAGE_KEY = 'moduville_dragon_stage'
const GOLD_KEY         = 'moduville_gold'
const PROOFS_KEY       = 'moduville_proofs'
const PROFILE_KEY      = 'moduville_profile'
const SOCIAL_KEY       = 'moduville_social'
const NOTIF_KEY        = 'moduville_notif_disabled'

export function saveOnboardingData(routine: GeneratedRoutine, goals: UserGoal[]): void {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine))
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
}

export function loadRoutine(): GeneratedRoutine | null {
  try {
    const raw = localStorage.getItem(ROUTINE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getCompletions(date: string): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    const all: Record<string, string[]> = raw ? JSON.parse(raw) : {}
    return new Set(all[date] ?? [])
  } catch {
    return new Set()
  }
}

export function loadGoals(): UserGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Letters ───────────────────────────────────────────────────────────────

export function loadLetters(): CitizenLetter[] {
  try {
    const raw = localStorage.getItem(LETTERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addLetter(letter: CitizenLetter): void {
  const existing = loadLetters()
  localStorage.setItem(LETTERS_KEY, JSON.stringify([letter, ...existing]))
}

export function markLetterRead(id: string): void {
  const letters = loadLetters()
  localStorage.setItem(
    LETTERS_KEY,
    JSON.stringify(letters.map(l => (l.id === id ? { ...l, read: true } : l)))
  )
}

export function getLastLetterDate(): string | null {
  return loadLetters()[0]?.date ?? null
}

// ── Completions ───────────────────────────────────────────────────────────

export function toggleCompletion(date: string, blockId: string): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    const all: Record<string, string[]> = raw ? JSON.parse(raw) : {}
    const set = new Set<string>(all[date] ?? [])
    if (set.has(blockId)) set.delete(blockId)
    else set.add(blockId)
    all[date] = Array.from(set)
    localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(all))
    return new Set(set)
  } catch {
    return new Set()
  }
}

// ── Dragon evolution ──────────────────────────────────────────────────────

export function getISOWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

const DOW_MAP: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function calcGoodWeeksFromHistory(routine: GeneratedRoutine): number {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    if (!raw) return 0
    const all: Record<string, string[]> = JSON.parse(raw)
    const currentWeek = getISOWeekKey()

    // Group recorded dates by ISO week
    const weekMap: Record<string, string[]> = {}
    for (const dateStr of Object.keys(all)) {
      const wk = getISOWeekKey(new Date(dateStr))
      if (wk === currentWeek) continue  // skip current (incomplete) week
      if (!weekMap[wk]) weekMap[wk] = []
      weekMap[wk].push(dateStr)
    }

    let good = 0
    for (const dates of Object.values(weekMap)) {
      const rates: number[] = []
      for (const dateStr of dates) {
        const dow = DOW_MAP[new Date(dateStr).getDay()]
        const scheduled = routine.blocks.filter(b => b.days.includes(dow))
        if (scheduled.length === 0) continue
        const done = scheduled.filter(b => (all[dateStr] ?? []).includes(b.id)).length
        rates.push(done / scheduled.length)
      }
      if (rates.length > 0) {
        const avg = rates.reduce((a, b) => a + b, 0) / rates.length
        if (avg >= 0.6) good++
      }
    }
    return good
  } catch {
    return 0
  }
}

export function calcDragonStage(goodWeeks: number): DragonStage {
  if (goodWeeks >= 7) return 'adult'
  if (goodWeeks >= 3) return 'baby'
  if (goodWeeks >= 1) return 'hatching'
  return 'egg'
}

export function stageRank(stage: DragonStage): number {
  return { egg: 0, hatching: 1, baby: 2, adult: 3 }[stage]
}

export function getDragonStage(): DragonStage {
  try {
    return (localStorage.getItem(DRAGON_STAGE_KEY) as DragonStage) ?? 'egg'
  } catch {
    return 'egg'
  }
}

export function saveDragonStage(stage: DragonStage): void {
  localStorage.setItem(DRAGON_STAGE_KEY, stage)
}

// ── Routine editing ───────────────────────────────────────────────────────────

function recalcWeeklyHours(blocks: GeneratedRoutine['blocks']): number {
  return Math.round(blocks.reduce((s, b) => s + b.duration * b.days.length, 0) / 60 * 10) / 10
}

export function saveRoutine(routine: GeneratedRoutine): void {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(routine))
}

export function updateBlock(updated: GeneratedRoutine['blocks'][number]): void {
  const r = loadRoutine()
  if (!r) return
  const blocks = r.blocks.map(b => (b.id === updated.id ? updated : b))
  saveRoutine({ ...r, blocks, totalWeeklyHours: recalcWeeklyHours(blocks) })
}

export function deleteBlock(id: string): void {
  const r = loadRoutine()
  if (!r) return
  const blocks = r.blocks.filter(b => b.id !== id)
  saveRoutine({ ...r, blocks, totalWeeklyHours: recalcWeeklyHours(blocks) })
}

export function addBlock(block: GeneratedRoutine['blocks'][number]): void {
  const r = loadRoutine()
  if (!r) return
  const blocks = [...r.blocks, block]
  saveRoutine({ ...r, blocks, totalWeeklyHours: recalcWeeklyHours(blocks) })
}

export function addBlocks(newBlocks: GeneratedRoutine['blocks']): void {
  const r = loadRoutine()
  if (!r) return
  const blocks = [...r.blocks, ...newBlocks]
  saveRoutine({ ...r, blocks, totalWeeklyHours: recalcWeeklyHours(blocks) })
}

// ── Gold ──────────────────────────────────────────────────────────────────────

export function getGoldBalance(): number {
  try {
    const raw = localStorage.getItem(GOLD_KEY)
    return raw !== null ? parseFloat(raw) : 50
  } catch { return 50 }
}

export function setGoldBalance(amount: number): void {
  localStorage.setItem(GOLD_KEY, String(Math.max(0, Math.round(amount * 100) / 100)))
}

export function deductGold(amount: number): number {
  const next = Math.max(0, getGoldBalance() - amount)
  setGoldBalance(next)
  return next
}

// ── Proofs ────────────────────────────────────────────────────────────────────

export function loadProofs(): ProofEntry[] {
  try {
    const raw = localStorage.getItem(PROOFS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveProof(proof: ProofEntry): void {
  const existing = loadProofs()
  localStorage.setItem(PROOFS_KEY, JSON.stringify([proof, ...existing]))
}

export function getProofsForDate(date: string): ProofEntry[] {
  return loadProofs().filter(p => p.date === date)
}

export function getAllCompletions(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

// ── Profile ───────────────────────────────────────────────────────────────────

export function getProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

// ── Social ────────────────────────────────────────────────────────────────────

function loadSocial(): SocialState {
  try {
    const raw = localStorage.getItem(SOCIAL_KEY)
    return raw ? JSON.parse(raw) : { friendStatuses: {}, sentGifts: [], sentEncouragements: [] }
  } catch { return { friendStatuses: {}, sentGifts: [], sentEncouragements: [] } }
}

function saveSocial(s: SocialState): void {
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(s))
}

export function getSocialState(): SocialState {
  return loadSocial()
}

export function setFriendStatus(userId: string, status: FriendStatus): void {
  const s = loadSocial()
  s.friendStatuses[userId] = status
  saveSocial(s)
}

export function recordGift(userId: string, pack: GiftRecord['pack']): void {
  const s = loadSocial()
  s.sentGifts = [{ userId, pack, date: new Date().toISOString().slice(0, 10) }, ...s.sentGifts]
  saveSocial(s)
}

export function recordEncouragement(userId: string): void {
  const s = loadSocial()
  if (!s.sentEncouragements.includes(userId)) s.sentEncouragements.push(userId)
  saveSocial(s)
}

// ── Installed templates ───────────────────────────────────────────────────────

const INSTALLED_TEMPLATES_KEY = 'moduville_installed_templates'

export function getInstalledTemplates(): Set<string> {
  try {
    const raw = localStorage.getItem(INSTALLED_TEMPLATES_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

export function markTemplateInstalled(id: string): void {
  const set = getInstalledTemplates()
  set.add(id)
  localStorage.setItem(INSTALLED_TEMPLATES_KEY, JSON.stringify(Array.from(set)))
}

// ── Notification prefs ────────────────────────────────────────────────────────

export function getDisabledNotifIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

export function setNotifDisabled(id: string, disabled: boolean): void {
  const set = getDisabledNotifIds()
  if (disabled) set.add(id); else set.delete(id)
  localStorage.setItem(NOTIF_KEY, JSON.stringify(Array.from(set)))
}
