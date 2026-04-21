import type { Task } from './useDb'
import { type UnlockedBadge } from './useGamification'

// ── Constants ──────────────────────────────────────────────────
const DAY = 86_400_000
const SCAN_INTERVAL_MS = 60_000 // re-scan every minute

// ── Module-level singletons ────────────────────────────────────
// These live for the lifetime of the page so a singleton is safe
// in a client-only (ssr: false) PWA.
let _loopStarted = false
let _permissionAsked = false

// Track which task IDs have already triggered a notification this
// session so we don't re-fire on every scan tick.  Cleared when
// the user acts on the task (done / snooze / skip).
const _notified = new Set<string>()

// ── Notification helpers ───────────────────────────────────────
async function requestPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  if (_permissionAsked) return false
  _permissionAsked = true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function fireNotification(task: Task): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (_notified.has(task.id)) return
  _notified.add(task.id)

  const overdueDays = Math.abs(Math.round((task.nextDue - Date.now()) / DAY))
  const title = task.status === 'overdue'
    ? `${task.icon} ${task.title} — overdue`
    : `${task.icon} ${task.title} is due`
  const body = task.status === 'overdue'
    ? `${overdueDays} day${overdueDays !== 1 ? 's' : ''} past due`
    : 'Tap to mark as done or snooze'

  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      // Same tag = OS replaces the old notification rather than stacking
      tag: task.id,
      renotify: false,
    })
  } catch {
    // Silently ignore — Notification may be unavailable without HTTPS
    // or in private-browsing contexts.
  }
}

// ── Core scan ─────────────────────────────────────────────────
async function scan(): Promise<void> {
  if (import.meta.server) return

  const db = useDb()
  const now = Date.now()
  const allTasks = await db.tasks.toArray()

  let anyChanged = false
  const toNotify: Task[] = []

  for (const task of allTasks) {
    let newStatus = task.status
    let newSnoozeUntil = task.snoozeUntil

    if (task.status === 'snoozed' && task.snoozeUntil !== null && task.snoozeUntil <= now) {
      // Snooze window expired — promote back to due / overdue
      newSnoozeUntil = null
      newStatus = now - task.nextDue > DAY ? 'overdue' : 'due'
    } else if (task.status === 'idle' && task.nextDue <= now) {
      // Idle task whose timer has fired
      newStatus = now - task.nextDue > DAY ? 'overdue' : 'due'
    } else if (task.status === 'due' && now - task.nextDue > DAY) {
      // Was "due" but has crossed the 24-hour threshold
      newStatus = 'overdue'
    }

    if (newStatus !== task.status || newSnoozeUntil !== task.snoozeUntil) {
      await db.tasks.update(task.id, { status: newStatus, snoozeUntil: newSnoozeUntil ?? null })
      anyChanged = true

      if (newStatus === 'due' || newStatus === 'overdue') {
        toNotify.push({ ...task, status: newStatus, snoozeUntil: newSnoozeUntil ?? null })
      }
    }
  }

  if (anyChanged) {
    await reloadTasks()
  }

  if (toNotify.length > 0) {
    // Request permission lazily — only when there is actually something to show
    await requestPermission()
    for (const task of toNotify) {
      fireNotification(task)
    }
  }
}

// ── Loop setup (idempotent) ────────────────────────────────────
function startLoop(): void {
  if (_loopStarted || import.meta.server) return
  _loopStarted = true

  // First scan after DB is guaranteed to be seeded
  useTasks().init().then(scan)

  // Periodic re-scan
  setInterval(scan, SCAN_INTERVAL_MS)

  // Re-scan whenever the user returns to the tab / app
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scan()
  })
}

// ── Composable ────────────────────────────────────────────────
export function useScheduler() {
  startLoop()

  const { completeTask, snoozeTask, skipTask: _skipTask } = useTasks()

  /**
   * Mark a task done: logs a completion, recomputes learnedInterval,
   * schedules the next due date, sets status → idle, and runs all
   * gamification hooks (XP, streak, badges, titles).
   * Returns any badges unlocked by this completion.
   */
  async function confirmDone(taskId: string): Promise<UnlockedBadge[]> {
    _notified.delete(taskId)

    // Capture task snapshot before completion mutates it
    const task = useTasks().tasks.value.find(t => t.id === taskId)

    await completeTask(taskId)

    if (!task) return []

    const { awardXp, updateStreak, checkBadges, checkTitles } = useGamification()

    // 1. Streak — must run before badge check so streak value is current
    const now = new Date()
    const { extended, newStreak } = await updateStreak(now)

    // 2. Base XP: 25 base + 10 if on-time or early + streak bonus (5/day, capped at 50)
    //    Compare local calendar dates (yyyy-mm-dd) — the full due day counts as on time.
    const localDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const confirmedDate = localDate(now)
    const dueDate = localDate(new Date(task.nextDue))
    // early: confirmed before due day | onTime: same day | overdue: confirmed after due day
    const punctualityBonus = confirmedDate <= dueDate ? 10 : 0
    const streakBonus = extended ? Math.min(newStreak * 5, 50) : 0
    await awardXp(25 + punctualityBonus + streakBonus, 'task-done')

    // 3. Badges
    const newBadges = await checkBadges({ taskId, task, streak: newStreak })
    for (const badge of newBadges) {
      await awardXp(badge.xp, `badge-${badge.id}`)
    }

    // 4. Titles (no XP, just unlock)
    await checkTitles()

    return newBadges
  }

  /**
   * Snooze a task: logs a snoozed completion, sets snoozeUntil,
   * and sets status → snoozed.  The next scan after snoozeUntil
   * will automatically promote the task back to due / overdue.
   */
  async function snooze(taskId: string, ms: number): Promise<void> {
    // Clear so a notification fires again when the snooze expires
    _notified.delete(taskId)
    await snoozeTask(taskId, ms)
  }

  /**
   * Skip a task without logging a completion: advances nextDue by
   * learnedInterval from now.
   */
  async function skipTask(taskId: string): Promise<void> {
    _notified.delete(taskId)
    await _skipTask(taskId)
  }

  return { confirmDone, snooze, skipTask, scan }
}
