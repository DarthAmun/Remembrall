<script setup lang="ts">
import type { TaskStatus } from '~/composables/useDb'

const props = defineProps<{
  status: TaskStatus
  daysOffset: number
}>()

const pill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '99px',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.3px',
} as const
</script>

<template>
  <span
    v-if="status === 'overdue'"
    :style="{ ...pill, color: '#f87171', background: 'rgba(248,113,113,0.15)' }"
  >
    ⚠ {{ Math.abs(daysOffset) }}d overdue
  </span>

  <span
    v-else-if="status === 'due' && daysOffset <= 0"
    :style="{ ...pill, color: '#fb923c', background: 'rgba(251,146,60,0.15)' }"
  >
    ▸ Due today
  </span>

  <span
    v-else-if="status === 'due'"
    :style="{ ...pill, color: '#fb923c', background: 'rgba(251,146,60,0.12)' }"
  >
    Due in {{ daysOffset }}d
  </span>

  <span
    v-else-if="status === 'snoozed'"
    :style="{ ...pill, color: 'rgba(210,210,255,0.35)', background: 'rgba(255,255,255,0.05)' }"
  >
    ⏱ snoozed
  </span>

  <span
    v-else
    :style="{ ...pill, color: 'rgba(210,210,255,0.35)', background: 'rgba(255,255,255,0.05)' }"
  >
    in {{ daysOffset }}d
  </span>
</template>
