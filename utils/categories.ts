export const CAT_COLORS: Record<string, string> = {
  health: '#2dd4bf',
  home: '#a78bfa',
  social: '#f472b6',
  finance: '#fbbf24',
  growth: '#34d399',
}

export const CATEGORIES = [
  { key: 'health', label: 'Health', color: '#2dd4bf' },
  { key: 'home', label: 'Home', color: '#a78bfa' },
  { key: 'social', label: 'Social', color: '#f472b6' },
  { key: 'finance', label: 'Finance', color: '#fbbf24' },
  { key: 'growth', label: 'Growth', color: '#34d399' },
] as const

export function catColor(category: string): string {
  return CAT_COLORS[category] ?? '#8b5cf6'
}
