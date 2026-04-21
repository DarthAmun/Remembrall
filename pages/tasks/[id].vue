<script setup lang="ts">
import type { Completion } from '~/composables/useDb'

definePageMeta({ pageTransition: { name: 'slide-right', mode: 'out-in' } })

const route = useRoute()
const id = route.params.id as string

const { tasks, init } = useTasks()
const task = computed(() => tasks.value.find(t => t.id === id))

const completions = ref<Completion[]>([])

onMounted(async () => {
  await init()
  const db = useDb()
  const all = await db.completions.where('taskId').equals(id).toArray()
  completions.value = all
    .filter(c => c.type === 'done')
    .sort((a, b) => b.confirmedAt - a.confirmedAt)
})

const intervalDays = computed(() =>
  task.value ? Math.round(task.value.learnedInterval / 86_400_000) : 0
)

const streak = computed(() => {
  if (!task.value || completions.value.length === 0) return 0
  const interval = task.value.learnedInterval
  let s = 1
  for (let i = 0; i < completions.value.length - 1; i++) {
    const gap = completions.value[i].confirmedAt - completions.value[i + 1].confirmedAt
    if (gap <= interval * 1.5) s++
    else break
  }
  return s
})

const completionRate = computed(() => {
  const n = completions.value.length
  return n === 0 ? 0 : Math.round((n / (n + 2)) * 100)
})

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const color = computed(() => task.value ? catColor(task.value.category) : '#8b5cf6')
const offset = computed(() => task.value ? daysOffset(task.value.nextDue) : 0)

useHead(() => ({ title: task.value ? `${task.value.title} – Remembrall` : 'Remembrall' }))
</script>

<template>
  <div v-if="task" :style="{ background: 'var(--c-bg0)', minHeight: '100vh', paddingBottom: '40px' }">

    <!-- Header -->
    <div :style="{
      padding: 'max(64px, calc(env(safe-area-inset-top) + 44px)) 16px 20px',
      background: 'linear-gradient(180deg, var(--c-bg1) 0%, var(--c-bg0) 100%)',
    }">
      <button
        :style="{
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '16px', padding: 0,
        }"
        @click="navigateTo('/')"
      >
        <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
          <path d="M7 1L1 6.5L7 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>

      <div style="display: flex; align-items: center; gap: 14px;">
        <div :style="{
          width: '60px', height: '60px', borderRadius: '18px',
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `1.5px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
        }">{{ task.icon }}</div>
        <div>
          <div style="font-size: 22px; font-weight: 800; color: var(--c-text); letter-spacing: -0.5px;">
            {{ task.title }}
          </div>
          <div style="font-size: 13px; color: var(--c-text-muted); margin-top: 2px; text-transform: capitalize;">
            {{ task.category }}
          </div>
        </div>
      </div>
    </div>

    <div style="padding: 0 16px; display: flex; flex-direction: column; gap: 14px;">

      <!-- Stats row -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
        <div
          v-for="stat in [
            { label: 'Interval', value: `${intervalDays}d`, sub: 'learned', color: 'var(--accent)' },
            { label: 'Streak', value: String(streak), sub: 'in a row', color: 'var(--accent2)' },
            { label: 'On Time', value: `${completionRate}%`, sub: 'completion', color: color },
          ]"
          :key="stat.label"
          :style="{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: '14px', padding: '14px 12px', textAlign: 'center',
          }"
        >
          <div :style="{ fontSize: '22px', fontWeight: 800, color: stat.color, letterSpacing: '-0.5px' }">
            {{ stat.value }}
          </div>
          <div :style="{
            fontSize: '10px', fontWeight: 700, color: 'var(--c-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '2px',
          }">{{ stat.label }}</div>
          <div style="font-size: 10px; color: var(--c-text-muted); margin-top: 1px;">{{ stat.sub }}</div>
        </div>
      </div>

      <!-- Learned interval explainer -->
      <div :style="{
        background: 'rgba(245,194,17,0.07)', border: '1px solid rgba(245,194,17,0.15)',
        borderRadius: '14px', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }">
        <div style="font-size: 22px;">🧠</div>
        <div>
          <div style="font-size: 13px; font-weight: 700; color: var(--c-text);">
            Learned interval: {{ intervalDays }} days
          </div>
          <div style="font-size: 11px; color: var(--c-text-muted); margin-top: 2px; line-height: 1.5;">
            Remembrall adapts this based on how consistently you complete on time.
          </div>
        </div>
      </div>

      <!-- Completion history -->
      <div :style="{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: '16px', padding: '16px',
      }">
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: '14px',
        }">Completion History</div>

        <div v-if="completions.length === 0" style="font-size: 14px; color: var(--c-text-muted); padding: 8px 0;">
          No completions yet
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 0;">
          <div
            v-for="(c, i) in completions"
            :key="c.id"
            :style="{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 0',
              borderBottom: i < completions.length - 1 ? '1px solid var(--c-border)' : 'none',
            }"
          >
            <div style="display: flex; flex-direction: column; align-items: center; width: 20px;">
              <div :style="{
                width: '10px', height: '10px', borderRadius: '5px',
                background: i === 0 ? `${color}` : `${color}44`,
                border: i === 0 ? `2px solid ${color}` : `2px solid ${color}33`,
              }" />
              <div
                v-if="i < completions.length - 1"
                :style="{ width: '1px', height: '20px', background: `${color}22`, marginTop: '2px' }"
              />
            </div>

            <div style="flex: 1;">
              <div :style="{
                fontSize: '14px', fontWeight: 600,
                color: i === 0 ? 'var(--c-text)' : 'var(--c-text-sec)',
              }">{{ formatDate(c.confirmedAt) }}</div>
              <div v-if="i === 0" :style="{ fontSize: '11px', color: color, marginTop: '1px' }">Most recent</div>
            </div>

            <div :style="{
              width: '28px', height: '28px', borderRadius: '8px',
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
            }">✓</div>
          </div>
        </div>
      </div>

      <!-- Next due -->
      <div :style="{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: '14px', padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }">
        <div>
          <div :style="{
            fontSize: '11px', fontWeight: 700, color: 'var(--c-text-muted)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px',
          }">Next due</div>
          <StatusBadge :status="task.status" :days-offset="offset" />
        </div>
        <div style="font-size: 24px;">📅</div>
      </div>
    </div>
  </div>

  <!-- Loading state -->
  <div
    v-else
    style="min-height: 100vh; background: var(--c-bg0); display: flex; align-items: center; justify-content: center;"
  >
    <div style="font-size: 14px; color: var(--c-text-muted);">Loading…</div>
  </div>
</template>
