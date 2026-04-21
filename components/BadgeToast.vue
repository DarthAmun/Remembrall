<script setup lang="ts">
import type { UnlockedBadge } from '~/composables/useGamification'

defineProps<{ badge: UnlockedBadge }>()
const emit = defineEmits<{ dismiss: [] }>()

const FLAVOR: Record<string, string> = {
  'first-steps':      'Your journey of a thousand habits begins here.',
  'getting-started':  'Ten down. Momentum is building.',
  'centurion':        'A hundred completions. You\'re a force of habit.',
  'unstoppable':      'Five hundred done. Nothing stops you now.',
  'streak-3':         'Three in a row — you\'re heating up!',
  'streak-7':         'A full week of consistency. Impressive.',
  'streak-30':        'A month of daily effort. Truly relentless.',
  'streak-100':       'One hundred days. You are legendary.',
  'punctual':         'Twenty-five tasks done right on time.',
  'on-time-master':   'A hundred on-time completions. Clockwork.',
  'health-hero':      'Twenty health tasks. You\'re thriving.',
  'home-keeper':      'Your home shines. Twenty tidy wins.',
  'social-butterfly': 'Stay close to the ones that matter.',
  'growth-seeker':    'Always learning, always growing.',
  'money-wise':       'Wealth is built in small, consistent steps.',
}

function flavor(id: string): string {
  if (id.startsWith('task-habit-'))    return 'Five times. It\'s becoming a habit.'
  if (id.startsWith('task-champion-')) return 'Twenty-five times. You\'ve mastered this routine.'
  if (id.startsWith('task-legend-'))   return 'Fifty completions. This task is part of who you are.'
  return FLAVOR[id] ?? 'Achievement unlocked!'
}

// Auto-dismiss progress bar
const progress = ref(100)
onMounted(() => {
  const TOTAL = 3000
  const TICK = 50
  const step = (TICK / TOTAL) * 100
  const iv = setInterval(() => {
    progress.value = Math.max(0, progress.value - step)
    if (progress.value <= 0) clearInterval(iv)
  }, TICK)
})
</script>

<template>
  <div
    :style="{
      background: 'var(--c-bg1)',
      border: '1px solid var(--c-border-med)',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }"
  >
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px;">
      <!-- Icon -->
      <div
        :style="{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: 'rgba(245,194,17,0.1)', border: '1px solid rgba(245,194,17,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
        }"
      >{{ badge.icon }}</div>

      <!-- Text -->
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 13px; font-weight: 700; color: var(--c-text);">{{ badge.label }}</div>
        <div style="font-size: 11px; color: var(--c-text-muted); margin-top: 2px; line-height: 1.4;">
          {{ flavor(badge.id) }}
        </div>
      </div>

      <!-- XP pill + dismiss -->
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
        <span
          :style="{
            fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
            color: 'var(--accent)', background: 'rgba(245,194,17,0.12)',
          }"
        >+{{ badge.xp }} XP</span>
        <button
          style="background: none; border: none; color: var(--c-text-muted); font-size: 16px; cursor: pointer; padding: 0; line-height: 1;"
          @click="emit('dismiss')"
        >×</button>
      </div>
    </div>

    <!-- Progress bar -->
    <div style="height: 3px; background: rgba(255,255,255,0.05);">
      <div
        :style="{
          height: '100%',
          width: progress + '%',
          background: 'rgba(245,194,17,0.5)',
          transition: 'width 0.05s linear',
        }"
      />
    </div>
  </div>
</template>
