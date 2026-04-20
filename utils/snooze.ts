export const SNOOZE_PRESETS = [
  { label: '1 hour', ms: 3_600_000, icon: '⏰' },
  { label: '3 hours', ms: 10_800_000, icon: '🕐' },
  { label: 'Tomorrow', ms: 86_400_000, icon: '🌅' },
  { label: '2 days', ms: 172_800_000, icon: '📅' },
  { label: '1 week', ms: 604_800_000, icon: '📆' },
] as const

export function parseSnooze(val: string): number {
  const m = val.trim().match(/^(\d+)\s*([hdw])$/i)
  if (!m) return 0
  const n = parseInt(m[1])
  const u = m[2].toLowerCase()
  if (u === 'h') return n * 3_600_000
  if (u === 'd') return n * 86_400_000
  if (u === 'w') return n * 604_800_000
  return 0
}
