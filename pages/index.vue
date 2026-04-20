<script setup lang="ts">
import type { Task } from '~/composables/useDb'

useHead({ title: 'Remembrall' })

const { tasks, init, completeTask, snoozeTask, skipTask } = useTasks()
const { scan } = useScheduler()

const activeTask = ref<Task | null>(null)
// ID of the task currently playing the done-burst animation
const completingId = ref<string | null>(null)

onMounted(async () => {
  await init()
  scan()
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
  activeTask.value = null        // close sheet immediately

  completingId.value = id        // show burst on card
  await new Promise(r => setTimeout(r, 320))  // let burst play
  completingId.value = null      // clear before status mutates

  await completeTask(id)         // status → idle; card leaves TransitionGroup
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
          <!-- Settings -->
          <button
            :style="{
              width: '40px', height: '40px', borderRadius: '20px',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.1s',
            }"
            @click="navigateTo('/settings')"
          >
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path
                d="M8.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
                stroke="rgba(210,210,255,0.5)" stroke-width="1.4"
              />
              <path
                d="M13.9 6.4l-.8-1.4-1.3.5a4.8 4.8 0 0 0-.9-.5L10.6 4H7.4l-.3 1a4.8 4.8 0 0 0-.9.5l-1.3-.5-.8 1.4 1 .8a4.9 4.9 0 0 0 0 1l-1 .8.8 1.4 1.3-.5c.3.2.6.4.9.5l.3 1h3.2l.3-1a4.8 4.8 0 0 0 .9-.5l1.3.5.8-1.4-1-.8a4.9 4.9 0 0 0 0-1z"
                stroke="rgba(210,210,255,0.5)" stroke-width="1.4" stroke-linejoin="round"
              />
            </svg>
          </button>

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

    <!-- PWA install banner -->
    <InstallBanner />
  </div>
</template>
