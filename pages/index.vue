<script setup lang="ts">
import type { Task } from '~/composables/useDb'
import { xpToNextLevel, TITLE_DEFS, type UnlockedBadge } from '~/composables/useGamification'

definePageMeta({ pageTransition: { name: 'slide-right', mode: 'out-in' } })
useHead({ title: 'Remembrall' })

const { tasks, init, snoozeTask, skipTask } = useTasks()
const { confirmDone, scan } = useScheduler()
const { profile, checkTitles } = useGamification()

const activeTask = ref<Task | null>(null)
const completingId = ref<string | null>(null)

// ── XP bar ────────────────────────────────────────────────────
const xpData = computed(() => {
  if (!profile.value) return { pct: 0, current: 0, needed: 100, level: 1, titleLabel: 'Newcomer' }
  const { current, needed } = xpToNextLevel(profile.value.totalXp)
  const titleLabel = TITLE_DEFS.find(t => t.key === profile.value!.currentTitle)?.label ?? 'Newcomer'
  return { pct: Math.min(100, (current / needed) * 100), current, needed, level: profile.value.level, titleLabel }
})

// ── Celebration payload ───────────────────────────────────────
const celebrationPayload = ref<{
  xpEarned: number
  newBadges: UnlockedBadge[]
  streak: number
  leveledUp: boolean
  newLevel: number
} | null>(null)

onMounted(async () => {
  await init()
  scan()
  checkTitles() // side-effect: initialises profile.value
})

const urgent = computed(() =>
  tasks.value.filter(t =>
    (t.status === 'overdue' || t.status === 'due') && t.id !== completingId.value,
  ),
)
const upcoming = computed(() =>
  tasks.value.filter(t => t.status === 'idle' || t.status === 'snoozed'),
)

function handleCardPress(task: Task) {
  if (task.status === 'overdue' || task.status === 'due') {
    activeTask.value = task
  } else {
    navigateTo(`/tasks/${task.id}`)
  }
}

async function onDone() {
  if (!activeTask.value) return
  const id = activeTask.value.id
  activeTask.value = null

  completingId.value = id
  await new Promise(r => setTimeout(r, 320))
  completingId.value = null

  const xpBefore = profile.value?.totalXp ?? 0
  const levelBefore = profile.value?.level ?? 1

  const newBadges = await confirmDone(id)

  celebrationPayload.value = {
    xpEarned: (profile.value?.totalXp ?? 0) - xpBefore,
    newBadges,
    streak: profile.value?.currentStreak ?? 0,
    leveledUp: (profile.value?.level ?? 1) > levelBefore,
    newLevel: profile.value?.level ?? 1,
  }
}

async function onSnooze(ms: number) {
  if (!activeTask.value) return
  await snoozeTask(activeTask.value.id, ms)
  activeTask.value = null
}

async function onSkip() {
  if (!activeTask.value) return
  await skipTask(activeTask.value.id)
  activeTask.value = null
}
</script>

<template>
  <div :style="{ background: 'var(--c-bg0)', minHeight: '100vh', paddingBottom: '80px', position: 'relative' }">

    <!-- Header -->
    <div :style="{
      padding: 'max(64px, calc(env(safe-area-inset-top) + 44px)) 20px 20px',
      background: 'linear-gradient(180deg, var(--c-bg1) 0%, var(--c-bg0) 100%)',
    }">
      <div style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div>
          <div style="font-size: 28px; font-weight: 800; color: var(--c-text); letter-spacing: -0.8px;">
            Remembrall
          </div>
          <div style="font-size: 13px; color: var(--c-text-muted); margin-top: 2px;">
            <template v-if="urgent.length > 0">
              {{ urgent.length }} task{{ urgent.length !== 1 ? 's' : '' }} need attention
            </template>
            <template v-else-if="tasks.length > 0">
              All on track ✓
            </template>
            <template v-else>
              Nothing to remember yet
            </template>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <!-- Add FAB -->
          <button
            :style="{
              width: '40px', height: '40px', borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(245,194,17,0.35)',
              transition: 'transform 0.1s',
              flexShrink: 0,
            }"
            @mousedown="($el as HTMLElement).style.transform = 'scale(0.9)'"
            @mouseup="($el as HTMLElement).style.transform = 'scale(1)'; navigateTo('/add')"
            @mouseleave="($el as HTMLElement).style.transform = 'scale(1)'"
            @touchstart.passive="($el as HTMLElement).style.transform = 'scale(0.9)'"
            @touchend="($el as HTMLElement).style.transform = 'scale(1)'; navigateTo('/add')"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- XP progress bar -->
    <div>
      <div style="height: 4px; background: rgba(255,255,255,0.06);">
        <div
          :style="{
            height: '100%',
            width: xpData.pct + '%',
            background: 'linear-gradient(90deg, #2dd4bf, #06b6d4)',
            borderRadius: '0 2px 2px 0',
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          }"
        />
      </div>
      <div style="padding: 6px 20px 8px; display: flex; align-items: center; gap: 8px;">
        <span
          :style="{
            fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
            color: '#2dd4bf',
            background: 'rgba(45,212,191,0.12)',
            border: '1px solid rgba(45,212,191,0.22)',
          }"
        >Lv {{ xpData.level }}</span>
        <span style="font-size: 12px; color: var(--c-text-muted);">{{ xpData.titleLabel }}</span>
        <span style="font-size: 11px; color: var(--c-text-muted); margin-left: auto; font-variant-numeric: tabular-nums;">
          {{ xpData.current }}/{{ xpData.needed }} XP
        </span>
      </div>
    </div>

    <!-- Task sections -->
    <div style="padding: 0 16px; display: flex; flex-direction: column; gap: 20px;">

      <!-- Needs Attention -->
      <div v-if="urgent.length > 0">
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase',
          marginBottom: '10px', paddingLeft: '4px',
        }">Needs Attention</div>

        <!-- TransitionGroup handles the card-exit animation -->
        <TransitionGroup
          tag="div"
          name="task-list"
          style="display: flex; flex-direction: column; gap: 8px; position: relative;"
        >
          <TaskCard
            v-for="task in urgent"
            :key="task.id"
            :task="task"
            :completing="task.id === completingId"
            @press="handleCardPress"
          />
        </TransitionGroup>
      </div>

      <!-- "All clear" state — tasks exist but none urgent -->
      <div
        v-if="tasks.length > 0 && urgent.length === 0"
        :style="{
          background: 'rgba(45,212,191,0.06)',
          border: '1px solid rgba(45,212,191,0.15)',
          borderRadius: '16px',
          padding: '20px 16px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }"
      >
        <div style="font-size: 28px;">🎉</div>
        <div>
          <div style="font-size: 15px; font-weight: 700; color: var(--c-text);">
            You're all caught up
          </div>
          <div style="font-size: 13px; color: var(--c-text-muted); margin-top: 2px;">
            Next task due in {{ upcoming.length > 0 ? daysOffset(Math.min(...upcoming.map(t => t.nextDue))) + 'd' : '…' }}
          </div>
        </div>
      </div>

      <!-- Upcoming -->
      <div v-if="upcoming.length > 0">
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase',
          marginBottom: '10px', paddingLeft: '4px',
        }">Upcoming</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <TaskCard
            v-for="task in upcoming"
            :key="task.id"
            :task="task"
            @press="handleCardPress"
          />
        </div>
      </div>

      <!-- Completely empty state -->
      <div
        v-if="tasks.length === 0"
        style="
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; padding: 80px 20px; text-align: center;
        "
      >
        <div style="font-size: 52px; line-height: 1;">🔮</div>
        <div style="font-size: 20px; font-weight: 800; color: var(--c-text); letter-spacing: -0.4px;">
          Nothing to remember
        </div>
        <div style="font-size: 14px; color: var(--c-text-muted); line-height: 1.5; max-width: 240px;">
          Tap <strong style="color: var(--accent);">+</strong> to add your first recurring task
        </div>
        <button
          :style="{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: 'none', borderRadius: '12px',
            padding: '12px 24px', color: '#0d0d14',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            marginTop: '4px',
          }"
          @click="navigateTo('/add')"
        >Add first task</button>
      </div>
    </div>

    <!-- Bottom sheet overlay -->
    <Transition name="sheet">
      <BottomSheet
        v-if="activeTask"
        :task="activeTask"
        @close="activeTask = null"
        @done="onDone"
        @snooze="onSnooze"
        @skip="onSkip"
      />
    </Transition>

    <!-- Celebration sheet -->
    <Transition name="sheet">
      <CelebrationSheet
        v-if="celebrationPayload"
        v-bind="celebrationPayload"
        @close="celebrationPayload = null"
      />
    </Transition>

    <!-- PWA install banner -->
    <InstallBanner />
  </div>
</template>
