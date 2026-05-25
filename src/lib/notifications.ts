import { getCompletions } from './storage'
import type { DayOfWeek, RoutineBlock } from './types'

function todayKey() { return new Date().toISOString().slice(0, 10) }

async function showNotif(title: string, body: string, tag: string) {
  if (typeof window === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, { body, tag, silent: false })
  } catch {
    // Fallback for browsers without service worker notification support
    new Notification(title, { body, tag })
  }
}

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('/sw.js')
  } catch { /* silent — non-critical */ }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

export interface ScheduleOpts {
  blocks:      RoutineBlock[]
  disabledIds: Set<string>
  todayDow:    DayOfWeek
}

export function scheduleNotifications({ blocks, disabledIds, todayDow }: ScheduleOpts): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = []
  const now     = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const todayBlocks = blocks
    .filter(b => b.days.includes(todayDow) && !disabledIds.has(b.id))
    .sort((a, b) => a.time.localeCompare(b.time))

  for (let i = 0; i < todayBlocks.length; i++) {
    const block   = todayBlocks[i]
    const next    = todayBlocks[i + 1] ?? null
    const [h, m]  = block.time.split(':').map(Number)
    const start   = h * 60 + m
    const end     = start + block.duration

    function delayMs(targetMin: number) {
      return (targetMin - nowMins) * 60_000
    }

    // Pre-warning: 10 min before start
    const preMs = delayMs(start - 10)
    if (preMs > 0) {
      timeouts.push(setTimeout(() =>
        showNotif(block.name, `Starts in 10 minutes — get ready.`, `pre-${block.id}`),
        preMs,
      ))
    }

    // On-time
    const onMs = delayMs(start)
    if (onMs > 0) {
      timeouts.push(setTimeout(() =>
        showNotif(`It's time for ${block.name} 🕐`, `Your routine is waiting.`, `start-${block.id}`),
        onMs,
      ))
    }

    // 15-min nudge (only if still not done)
    const nudgeMs = delayMs(start + 15)
    if (nudgeMs > 0) {
      const { id, name } = block
      timeouts.push(setTimeout(() => {
        if (!getCompletions(todayKey()).has(id)) {
          showNotif(name, `Still time to start. Even 5 minutes counts.`, `nudge-${id}`)
        }
      }, nudgeMs))
    }

    // Hyperfocus guard: 20 min past end, if not done and there's a next block
    const hyperMs = delayMs(end + 20)
    if (hyperMs > 0 && next) {
      const { id, name } = block
      const nextName     = next.name
      timeouts.push(setTimeout(() => {
        if (!getCompletions(todayKey()).has(id)) {
          showNotif(`${nextName} is waiting`, `Time to transition from ${name}.`, `hyper-${id}`)
        }
      }, hyperMs))
    }
  }

  return () => timeouts.forEach(t => clearTimeout(t))
}
