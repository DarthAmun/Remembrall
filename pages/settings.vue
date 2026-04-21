<script setup lang="ts">
import type { Task } from '~/composables/useDb'

definePageMeta({ pageTransition: { name: 'slide-right', mode: 'out-in' } })
useHead({ title: 'Settings – Remembrall' })

const { tasks, init, renameTask, deleteTask } = useTasks()
const { public: { version } } = useRuntimeConfig()

onMounted(() => init())

// ── Inline rename ──────────────────────────────────────────
const editingId = ref<string | null>(null)
const editingTitle = ref('')

function startEdit(task: Task) {
  editingId.value = task.id
  editingTitle.value = task.title
  nextTick(() => {
    const el = document.getElementById(`title-input-${task.id}`)
    el?.focus()
    ;(el as HTMLInputElement)?.select()
  })
}

async function commitEdit() {
  if (!editingId.value) return
  const trimmed = editingTitle.value.trim()
  if (trimmed && trimmed !== tasks.value.find(t => t.id === editingId.value)?.title) {
    await renameTask(editingId.value, trimmed)
  }
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

// ── Delete with inline confirmation ───────────────────────
const confirmDeleteId = ref<string | null>(null)

function requestDelete(id: string) {
  confirmDeleteId.value = id
}

async function confirmDelete(id: string) {
  await deleteTask(id)
  confirmDeleteId.value = null
}

function cancelDelete() {
  confirmDeleteId.value = null
}

// ── Interval formatting ────────────────────────────────────
function fmtDays(ms: number): string {
  const d = Math.round(ms / 86_400_000)
  return d === 1 ? '1 day' : `${d} days`
}

function learnedDiff(task: Task): string | null {
  const diff = task.learnedInterval - task.baseInterval
  if (Math.abs(diff) < 3_600_000) return null   // less than 1h difference → same
  const d = Math.round(diff / 86_400_000)
  return d > 0 ? `+${d}d` : `${d}d`
}
</script>

<template>
  <div :style="{ background: 'var(--c-bg0)', minHeight: '100vh', paddingBottom: '60px' }">

    <!-- Header -->
    <div :style="{
      padding: 'max(64px, calc(env(safe-area-inset-top) + 44px)) 16px 16px',
      background: 'linear-gradient(180deg, var(--c-bg1) 0%, var(--c-bg0) 100%)',
      display: 'flex', alignItems: 'center', gap: '12px',
    }">
      <button
        :style="{
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
        }"
        @click="navigateTo('/')"
      >
        <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
          <path d="M7 1L1 6.5L7 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>
      <div style="font-size: 20px; font-weight: 800; color: var(--c-text); letter-spacing: -0.4px;">
        Settings
      </div>
    </div>

    <div style="padding: 8px 16px; display: flex; flex-direction: column; gap: 24px;">

      <!-- Tasks section -->
      <div>
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase',
          marginBottom: '10px', paddingLeft: '4px',
        }">Your Tasks</div>

        <!-- Empty state -->
        <div
          v-if="tasks.length === 0"
          :style="{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: '16px', padding: '32px 20px', textAlign: 'center',
          }"
        >
          <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
          <div style="font-size: 14px; color: var(--c-text-muted);">No tasks yet</div>
        </div>

        <div
          v-else
          :style="{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: '16px', overflow: 'hidden',
          }"
        >
          <div
            v-for="(task, i) in tasks"
            :key="task.id"
            :style="{
              padding: '14px 16px',
              borderBottom: i < tasks.length - 1 ? '1px solid var(--c-border)' : 'none',
              display: 'flex', alignItems: 'center', gap: '12px',
            }"
          >
            <!-- Category colour dot + icon -->
            <div
              :style="{
                width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
                background: `linear-gradient(135deg, ${catColor(task.category)}22, ${catColor(task.category)}11)`,
                border: `1px solid ${catColor(task.category)}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }"
            >{{ task.icon }}</div>

            <!-- Name + interval meta -->
            <div style="flex: 1; min-width: 0;">
              <!-- Editable title -->
              <input
                v-if="editingId === task.id"
                :id="`title-input-${task.id}`"
                v-model="editingTitle"
                class="task-title-input"
                @keydown.enter="commitEdit"
                @keydown.esc="cancelEdit"
                @blur="commitEdit"
              />
              <div
                v-else
                :style="{
                  fontSize: '15px', fontWeight: 600,
                  color: 'var(--c-text)', letterSpacing: '-0.2px',
                  cursor: 'text', marginBottom: '4px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }"
                :title="'Tap to rename'"
                @click="startEdit(task)"
              >{{ task.title }}</div>

              <!-- Interval pills -->
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span :style="{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  fontSize: '11px', fontWeight: 600, padding: '1px 7px',
                  borderRadius: '99px',
                  color: 'var(--accent)', background: 'rgba(245,194,17,0.1)',
                  border: '1px solid rgba(245,194,17,0.2)',
                }">
                  🧠 {{ fmtDays(task.learnedInterval) }}
                </span>
                <span :style="{
                  fontSize: '11px', color: 'var(--c-text-muted)',
                }">base {{ fmtDays(task.baseInterval) }}</span>
                <span
                  v-if="learnedDiff(task)"
                  :style="{
                    fontSize: '11px', fontWeight: 700,
                    color: (task.learnedInterval > task.baseInterval) ? '#2dd4bf' : '#f87171',
                  }"
                >{{ learnedDiff(task) }}</span>
              </div>
            </div>

            <!-- Edit / Delete controls -->
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
              <!-- Delete confirmation inline -->
              <template v-if="confirmDeleteId === task.id">
                <button
                  :style="{
                    background: 'rgba(248,113,113,0.15)',
                    border: '1px solid rgba(248,113,113,0.3)',
                    borderRadius: '8px', padding: '5px 10px',
                    color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  }"
                  @click="confirmDelete(task.id)"
                >Delete</button>
                <button
                  :style="{
                    background: 'none',
                    border: '1px solid var(--c-border)',
                    borderRadius: '8px', padding: '5px 10px',
                    color: 'var(--c-text-muted)', fontSize: '12px', cursor: 'pointer',
                  }"
                  @click="cancelDelete"
                >Cancel</button>
              </template>

              <template v-else>
                <!-- Edit pencil -->
                <button
                  :style="{
                    background: 'none', border: 'none',
                    color: 'var(--c-text-muted)', cursor: 'pointer',
                    padding: '6px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center',
                  }"
                  :title="'Rename task'"
                  @click="startEdit(task)"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M10.5 2.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>

                <!-- Trash -->
                <button
                  :style="{
                    background: 'none', border: 'none',
                    color: 'rgba(248,113,113,0.5)', cursor: 'pointer',
                    padding: '6px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center',
                  }"
                  :title="'Delete task'"
                  @click="requestDelete(task.id)"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2 4h11M5 4V2.5h5V4M6 7v4M9 7v4M3 4l.9 8.5a1 1 0 001 .9h6.2a1 1 0 001-.9L13 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- About section -->
      <div>
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase',
          marginBottom: '10px', paddingLeft: '4px',
        }">About</div>
        <div :style="{
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: '16px', overflow: 'hidden',
        }">
          <div :style="{
            padding: '14px 16px',
            borderBottom: '1px solid var(--c-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }">
            <span style="font-size: 14px; color: var(--c-text-sec);">Version</span>
            <span style="font-size: 14px; color: var(--c-text-muted);">{{ version }}</span>
          </div>
          <div :style="{
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }">
            <span style="font-size: 14px; color: var(--c-text-sec);">Storage</span>
            <span style="font-size: 14px; color: var(--c-text-muted);">On-device (offline)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
