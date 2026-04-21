import type { Profile, Task } from './useDb'

const DAY = 86_400_000

// ── Level curve ──────────────────────────────────────────────────────────────
// lv 1–5  : 100 XP each
// lv 6–15 : 250 XP each
// lv 16–30: 500 XP each
// lv 31+  : 1000 XP each

function xpCostForLevel(level: number): number {
  if (level <= 5) return 100
  if (level <= 15) return 250
  if (level <= 30) return 500
  return 1000
}

export function computeLevel(totalXp: number): number {
  let level = 1
  let accumulated = 0
  while (true) {
    const cost = xpCostForLevel(level)
    if (totalXp < accumulated + cost) break
    accumulated += cost
    level++
  }
  return level
}

/** XP needed to go from current level to next level. */
export function xpToNextLevel(totalXp: number): { current: number; needed: number } {
  const level = computeLevel(totalXp)
  let threshold = 0
  for (let l = 1; l < level; l++) threshold += xpCostForLevel(l)
  const needed = xpCostForLevel(level)
  return { current: totalXp - threshold, needed }
}

// ── Badge definitions ────────────────────────────────────────────────────────

interface BadgeStats {
  totalDone: number
  taskDone: number
  streak: number
  onTimeTotal: number
  categoryDone: Record<string, number>
}

interface BadgeDef {
  id: string
  icon: string
  label: string
  xp: number
  perTask: boolean
  check(s: BadgeStats): boolean
}

export const BADGE_DEFS: BadgeDef[] = [
  // ── Milestone ──────────────────────────────────────────────────────────────
  { id: 'first-steps',      icon: '🌱', label: 'First Steps',        xp: 50,   perTask: false, check: s => s.totalDone === 1 },
  { id: 'getting-started',  icon: '⚡', label: 'Getting Started',    xp: 100,  perTask: false, check: s => s.totalDone === 10 },
  { id: 'centurion',        icon: '💯', label: 'Centurion',          xp: 500,  perTask: false, check: s => s.totalDone === 100 },
  { id: 'unstoppable',      icon: '🚀', label: 'Unstoppable',        xp: 2000, perTask: false, check: s => s.totalDone === 500 },
  // ── Streaks ────────────────────────────────────────────────────────────────
  { id: 'streak-3',         icon: '🔥', label: 'On Fire',            xp: 75,   perTask: false, check: s => s.streak === 3 },
  { id: 'streak-7',         icon: '🔥', label: 'Week Warrior',       xp: 200,  perTask: false, check: s => s.streak === 7 },
  { id: 'streak-30',        icon: '🔥', label: 'Month Master',       xp: 1000, perTask: false, check: s => s.streak === 30 },
  { id: 'streak-100',       icon: '🌠', label: 'Legendary Streak',   xp: 5000, perTask: false, check: s => s.streak === 100 },
  // ── Punctuality ───────────────────────────────────────────────────────────
  { id: 'punctual',         icon: '⏰', label: 'Punctual',           xp: 150,  perTask: false, check: s => s.onTimeTotal === 25 },
  { id: 'on-time-master',   icon: '🕐', label: 'On-Time Master',     xp: 500,  perTask: false, check: s => s.onTimeTotal === 100 },
  // ── Category ──────────────────────────────────────────────────────────────
  { id: 'health-hero',      icon: '💪', label: 'Health Hero',        xp: 200,  perTask: false, check: s => (s.categoryDone['health'] ?? 0) === 20 },
  { id: 'home-keeper',      icon: '🏠', label: 'Home Keeper',        xp: 200,  perTask: false, check: s => (s.categoryDone['home'] ?? 0) === 20 },
  { id: 'social-butterfly', icon: '🦋', label: 'Social Butterfly',   xp: 150,  perTask: false, check: s => (s.categoryDone['social'] ?? 0) === 10 },
  { id: 'growth-seeker',    icon: '📈', label: 'Growth Seeker',      xp: 200,  perTask: false, check: s => (s.categoryDone['growth'] ?? 0) === 20 },
  { id: 'money-wise',       icon: '💰', label: 'Money Wise',         xp: 150,  perTask: false, check: s => (s.categoryDone['finance'] ?? 0) === 10 },
  // ── Per-task ──────────────────────────────────────────────────────────────
  { id: 'task-habit',       icon: '⭐', label: 'Task Habit',         xp: 75,   perTask: true,  check: s => s.taskDone === 5 },
  { id: 'task-champion',    icon: '🌟', label: 'Task Champion',      xp: 200,  perTask: true,  check: s => s.taskDone === 25 },
  { id: 'task-legend',      icon: '🏆', label: 'Task Legend',        xp: 500,  perTask: true,  check: s => s.taskDone === 50 },
]

// ── Title definitions ────────────────────────────────────────────────────────

interface TitleCheckParams {
  level: number
  streak: number
  totalDone: number
  badgeCount: number
}

interface TitleDef {
  key: string
  label: string
  check(p: TitleCheckParams): boolean
}

export const TITLE_DEFS: TitleDef[] = [
  { key: 'newcomer',        label: 'Newcomer',        check: () => true },
  { key: 'apprentice',      label: 'Apprentice',      check: p => p.level >= 5 },
  { key: 'consistent',      label: 'Consistent',      check: p => p.streak >= 7 },
  { key: 'adept',           label: 'Adept',           check: p => p.level >= 10 },
  { key: 'relentless',      label: 'Relentless',      check: p => p.streak >= 30 },
  { key: 'veteran',         label: 'Veteran',         check: p => p.totalDone >= 100 },
  { key: 'badge-collector', label: 'Badge Collector', check: p => p.badgeCount >= 5 },
  { key: 'expert',          label: 'Expert',          check: p => p.level >= 20 },
  { key: 'badge-hoarder',   label: 'Badge Hoarder',   check: p => p.badgeCount >= 15 },
  { key: 'master',          label: 'Master',          check: p => p.level >= 35 },
  { key: 'champion',        label: 'Champion',        check: p => p.totalDone >= 500 },
  { key: 'legend',          label: 'Legend',          check: p => p.level >= 50 },
]

// ── Profile helpers ──────────────────────────────────────────────────────────

function defaultProfile(): Profile {
  return {
    id: 'me',
    totalXp: 0,
    level: 1,
    currentTitle: 'newcomer',
    unlockedTitles: ['newcomer'],
    currentStreak: 0,
    longestStreak: 0,
    lastCompletionDate: null,
  }
}

function toLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Module-level reactive profile ────────────────────────────────────────────

export const profile = ref<Profile | null>(null)

async function loadProfile(): Promise<Profile> {
  const db = useDb()
  let p = await db.profile.get('me')
  if (!p) {
    p = defaultProfile()
    await db.profile.add(p)
  }
  profile.value = p
  return p
}

// ── Public badge result shape ─────────────────────────────────────────────────

export interface UnlockedBadge {
  id: string
  icon: string
  label: string
  xp: number
  taskId: string | null
}

// ── Composable ───────────────────────────────────────────────────────────────

export function useGamification() {
  const db = useDb()

  /**
   * Add XP, recompute level. Never decrements. Returns whether a level-up
   * occurred and the new level number.
   */
  async function awardXp(
    amount: number,
    _reason?: string,
  ): Promise<{ leveledUp: boolean; newLevel: number }> {
    const current = profile.value ?? (await loadProfile())
    const newXp = current.totalXp + amount
    const newLevel = computeLevel(newXp)
    const leveledUp = newLevel > current.level
    const update: Partial<Profile> = { totalXp: newXp, level: newLevel }
    await db.profile.update('me', update)
    profile.value = { ...current, ...update }
    return { leveledUp, newLevel }
  }

  /**
   * Extend (or reset) the daily streak based on a completion date.
   * Returns whether the streak was extended (i.e. grew) and the new value.
   * Same-day completions are ignored. Resets happen silently (extended=false).
   */
  async function updateStreak(
    completionDate: Date,
  ): Promise<{ extended: boolean; newStreak: number }> {
    const current = profile.value ?? (await loadProfile())
    const today = toLocalDate(completionDate)

    if (current.lastCompletionDate === today) {
      return { extended: false, newStreak: current.currentStreak }
    }

    let newStreak: number
    if (current.lastCompletionDate) {
      const lastMs = new Date(current.lastCompletionDate).getTime()
      const todayMs = new Date(today).getTime()
      const diffDays = Math.round((todayMs - lastMs) / DAY)
      newStreak = diffDays === 1 ? current.currentStreak + 1 : 1
    } else {
      newStreak = 1
    }

    const extended = newStreak > current.currentStreak
    const newLongest = Math.max(current.longestStreak, newStreak)
    const update: Partial<Profile> = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletionDate: today,
    }
    await db.profile.update('me', update)
    profile.value = { ...current, ...update }
    return { extended, newStreak }
  }

  /**
   * Run all badge unlock checks after a task completion.
   * Returns only newly unlocked badges; does NOT award their XP (caller must).
   */
  async function checkBadges(event: {
    taskId: string
    task: Task
    streak: number
  }): Promise<UnlockedBadge[]> {
    const [allDone, allTasks, existingBadges] = await Promise.all([
      db.completions.where('type').equals('done').toArray(),
      db.tasks.toArray(),
      db.badges.toArray(),
    ])

    const alreadyUnlocked = new Set(existingBadges.map(b => b.id))
    const taskCategoryMap = new Map(allTasks.map(t => [t.id, t.category]))

    const totalDone = allDone.length
    const taskDone = allDone.filter(c => c.taskId === event.taskId).length
    // On-time = confirmed within 24 h of the due timestamp
    const onTimeTotal = allDone.filter(c => c.confirmedAt <= c.dueAt + DAY).length

    const categoryDone: Record<string, number> = {}
    for (const c of allDone) {
      const cat = taskCategoryMap.get(c.taskId) ?? 'other'
      categoryDone[cat] = (categoryDone[cat] ?? 0) + 1
    }

    const stats: BadgeStats = {
      totalDone,
      taskDone,
      streak: event.streak,
      onTimeTotal,
      categoryDone,
    }

    const now = Date.now()
    const newlyUnlocked: UnlockedBadge[] = []

    for (const def of BADGE_DEFS) {
      const badgeId = def.perTask ? `${def.id}-${event.taskId}` : def.id
      if (alreadyUnlocked.has(badgeId)) continue
      if (!def.check(stats)) continue

      await db.badges.add({
        id: badgeId,
        unlockedAt: now,
        taskId: def.perTask ? event.taskId : null,
      })
      newlyUnlocked.push({
        id: badgeId,
        icon: def.icon,
        label: def.label,
        xp: def.xp,
        taskId: def.perTask ? event.taskId : null,
      })
    }

    return newlyUnlocked
  }

  /**
   * Evaluate title conditions and add any newly earned titles to
   * unlockedTitles. Does NOT auto-change currentTitle so users keep their
   * manually chosen title.
   * Returns the keys of newly unlocked titles.
   */
  async function checkTitles(): Promise<string[]> {
    const [current, totalDone, badgeCount] = await Promise.all([
      loadProfile(),
      db.completions.where('type').equals('done').count(),
      db.badges.count(),
    ])

    const params: TitleCheckParams = {
      level: current.level,
      streak: current.currentStreak,
      totalDone,
      badgeCount,
    }

    const newTitles = TITLE_DEFS
      .filter(d => !current.unlockedTitles.includes(d.key) && d.check(params))
      .map(d => d.key)

    if (newTitles.length > 0) {
      const updated = [...current.unlockedTitles, ...newTitles]
      await db.profile.update('me', { unlockedTitles: updated })
      profile.value = { ...current, unlockedTitles: updated }
    }

    return newTitles
  }

  return { profile, awardXp, updateStreak, checkBadges, checkTitles }
}
