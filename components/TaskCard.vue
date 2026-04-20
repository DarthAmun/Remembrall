<script setup lang="ts">
import type { Task } from '~/composables/useDb'

const props = defineProps<{
  task: Task
  compact?: boolean
  completing?: boolean
}>()

const emit = defineEmits<{
  press: [task: Task]
}>()

const pressed = ref(false)
const isUrgent = computed(() => props.task.status === 'overdue' || props.task.status === 'due')
const color = computed(() => catColor(props.task.category))
const offset = computed(() => daysOffset(props.task.nextDue))

const glowColor = computed(() => {
  if (props.task.status === 'overdue') return 'rgba(248,113,113,0.12)'
  if (props.task.status === 'due') return 'rgba(251,146,60,0.08)'
  return 'transparent'
})

const borderColor = computed(() => {
  if (props.task.status === 'overdue') return 'rgba(248,113,113,0.2)'
  if (props.task.status === 'due') return 'rgba(251,146,60,0.18)'
  return 'rgba(255,255,255,0.07)'
})

// Sparkle positions (dx/dy in px) radiating from centre
const SPARKLES = [
  { dx: '-26px', dy: '-20px' },
  { dx:  '26px', dy: '-20px' },
  { dx: '-30px', dy:   '4px' },
  { dx:  '30px', dy:   '4px' },
  { dx: '-16px', dy:  '24px' },
  { dx:  '16px', dy:  '24px' },
]

function onPress() {
  pressed.value = false
  emit('press', props.task)
}
</script>

<template>
  <div
    :style="{
      background: pressed ? 'var(--c-surface-hover)' : 'var(--c-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: '16px',
      padding: compact ? '12px 14px' : '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background 0.12s ease, transform 0.12s ease',
      transform: pressed ? 'scale(0.98)' : 'scale(1)',
      boxShadow: isUrgent ? `0 0 0 1px ${glowColor}, inset 0 0 20px ${glowColor}` : 'none',
      position: 'relative',
      overflow: 'hidden',
    }"
    @mousedown="pressed = true"
    @mouseup="onPress"
    @mouseleave="pressed = false"
    @touchstart.passive="pressed = true"
    @touchend="onPress"
  >
    <!-- Icon bubble -->
    <div
      :style="{
        width: compact ? '38px' : '44px',
        height: compact ? '38px' : '44px',
        borderRadius: '12px',
        flexShrink: 0,
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        border: `1px solid ${color}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: compact ? '18px' : '20px',
      }"
    >{{ task.icon }}</div>

    <!-- Text -->
    <div style="flex: 1; min-width: 0;">
      <div
        :style="{
          fontSize: compact ? '14px' : '15px',
          fontWeight: 600,
          color: 'var(--c-text)',
          letterSpacing: '-0.2px',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }"
      >{{ task.title }}</div>
      <StatusBadge :status="task.status" :days-offset="offset" />
    </div>

    <!-- Right side: chevron for urgent, interval text for idle -->
    <svg
      v-if="isUrgent"
      width="8" height="14" viewBox="0 0 8 14" fill="none"
      style="flex-shrink: 0;"
    >
      <path
        d="M1 1l6 6-6 6"
        :stroke="task.status === 'overdue' ? '#f87171' : '#fb923c'"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div
      v-else
      style="font-size: 11px; color: var(--c-text-muted); text-align: right; flex-shrink: 0;"
    >
      every<br>
      <span style="color: var(--c-text-sec); font-weight: 600;">
        {{ Math.round(task.learnedInterval / 86_400_000) }}d
      </span>
    </div>

    <!-- ── Done burst overlay ───────────────────────────── -->
    <div
      v-if="completing"
      :style="{
        position: 'absolute', inset: 0,
        borderRadius: '16px',
        pointerEvents: 'none',
        zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'burstOverlay 0.35s ease forwards',
      }"
    >
      <!-- Radial circle -->
      <div
        :style="{
          position: 'absolute', inset: 0,
          borderRadius: '16px',
          background: 'radial-gradient(circle at 50% 50%, rgba(45,212,191,0.35) 0%, transparent 65%)',
          animation: 'burstCircle 0.35s ease forwards',
        }"
      />

      <!-- Checkmark -->
      <span
        :style="{
          position: 'relative', zIndex: 2,
          fontSize: '26px', color: '#2dd4bf', fontWeight: 700, lineHeight: 1,
          textShadow: '0 0 12px rgba(45,212,191,0.6)',
          animation: 'checkPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        }"
      >✓</span>

      <!-- Sparkle particles -->
      <div
        v-for="(s, i) in SPARKLES"
        :key="i"
        :style="{
          position: 'absolute',
          width: '6px', height: '6px',
          borderRadius: '50%',
          background: i % 2 === 0 ? '#2dd4bf' : 'var(--accent)',
          '--dx': s.dx,
          '--dy': s.dy,
          animation: `sparkle 0.35s ease-out ${i * 25}ms forwards`,
        } as any"
      />
    </div>
  </div>
</template>
