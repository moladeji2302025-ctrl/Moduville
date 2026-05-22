import type { GeneratedRoutine, UserGoal } from './types'

const ROUTINE_KEY = 'moduville_routine'
const GOALS_KEY = 'moduville_goals'
const COMPLETIONS_KEY = 'moduville_completions'

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
