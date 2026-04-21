<script setup lang="ts">
import type { Task } from '~/composables/useDb'

definePageMeta({ pageTransition: { name: 'slide-right', mode: 'out-in' } })
useHead({ title: 'Settings – Remembrall' })

const { tasks, init, updateTask, deleteTask } = useTasks()
const { public: { version } } = useRuntimeConfig()
const { permission: notifPermission, periodicSyncSupported, enable: enableNotifications } = useNotifications()

onMounted(() => init())

// ── Edit form ──────────────────────────────────────────────────
const editingId = ref<string | null>(null)
const editEmoji = ref('')
const editTitle = ref('')
const editIntervalDays = ref(7)
const editCategory = ref('health')
const showEmojiPicker = ref(false)

function startEdit(task: Task) {
  editingId.value = task.id
  editEmoji.value = task.icon
  editTitle.value = task.title
  editIntervalDays.value = Math.round(task.baseInterval / 86_400_000)
  editCategory.value = task.category
  showEmojiPicker.value = false
  nextTick(() => {
    document.getElementById('edit-title-input')?.focus()
  })
}

async function saveEdit() {
  if (!editingId.value || !editTitle.value.trim()) return
  await updateTask(editingId.value, {
    icon: editEmoji.value,
    title: editTitle.value.trim(),
    intervalDays: editIntervalDays.value,
    category: editCategory.value,
  })
  editingId.value = null
}

function cancelEdit() {
  editingId.value = null
}

// ── Delete with inline confirmation ───────────────────────────
const confirmDeleteId = ref<string | null>(null)

function requestDelete(id: string) {
  confirmDeleteId.value = id
}

async function confirmDelete(id: string) {
  await deleteTask(id)
  confirmDeleteId.value = null
  if (editingId.value === id) editingId.value = null
}

function cancelDelete() {
  confirmDeleteId.value = null
}

// ── Interval formatting ────────────────────────────────────────
function fmtDays(ms: number): string {
  const d = Math.round(ms / 86_400_000)
  return d === 1 ? '1 day' : `${d} days`
}

function learnedDiff(task: Task): string | null {
  const diff = task.learnedInterval - task.baseInterval
  if (Math.abs(diff) < 3_600_000) return null
  const d = Math.round(diff / 86_400_000)
  return d > 0 ? `+${d}d` : `${d}d`
}

function intervalLabel(n: number) {
  if (n === 1) return 'Daily'
  if (n === 7) return 'Weekly'
  if (n === 14) return '2 weeks'
  if (n === 30) return 'Monthly'
  return `${n} days`
}

const INTERVAL_PRESETS = [1, 2, 3, 7, 14, 30]

const EMOJI_CATS = [
  { label: 'Health', emojis: ['💊','🏋️','🧘','🦷','🏃','🚴','💪','😴','🩺','❤️','🧬','🧠','🩹','🌡️','🫀','🫁'] },
  { label: 'Food & Drink', emojis: ['🍊','🥦','🍎','☕','🍵','💧','🥤','🧃','🥗','🥐','🫖','🍳','🥚','🫐','🥑','🍇'] },
  { label: 'Home', emojis: ['🧹','🌱','🪴','🏠','🧺','🔧','🚿','🧽','🛋️','🪟','🛏️','🕯️','🧴','🪣','🔑','🪑'] },
  { label: 'Social', emojis: ['📞','💌','🤝','🎉','👋','🫂','🥂','🎁','💬','📨','🫶','🎊'] },
  { label: 'Finance', emojis: ['🧾','💰','📊','💳','🏦','📈','🪙','💵','📉','🏧','💹','💸'] },
  { label: 'Learning', emojis: ['📖','✏️','📚','🎓','🔬','🧩','📝','🗒️','🖊️','📐','🔭','🧪'] },
  { label: 'Work', emojis: ['💼','📧','🖥️','📋','⏰','🗓️','📌','🗂️','🖨️','⌨️','📎','🖇️'] },
  { label: 'Creative', emojis: ['🎨','🎵','🎸','🎭','🎬','🖌️','✍️','🎤','🎹','🎺','🎻','🥁'] },
  { label: 'Outdoors', emojis: ['🌿','🌳','🌊','⛰️','🌄','🚵','🏕️','🌻','🦋','🐦','🌙','⭐'] },
  { label: 'Fun & Games', emojis: ['🎮','🌈','🎲','🎯','🏆','🎗️','🔮','🌀','✨','💫','🎪','🃏'] },
]
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
          >
            <!-- Task row -->
            <div
              :style="{
                padding: '14px 16px',
                borderBottom: (editingId === task.id || i < tasks.length - 1) ? '1px solid var(--c-border)' : 'none',
                display: 'flex', alignItems: 'center', gap: '12px',
              }"
            >
              <!-- Icon bubble -->
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
                <div :style="{
                  fontSize: '15px', fontWeight: 600,
                  color: 'var(--c-text)', letterSpacing: '-0.2px',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }">{{ task.title }}</div>

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
                  <span style="font-size: 11px; color: var(--c-text-muted);">base {{ fmtDays(task.baseInterval) }}</span>
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
                      background: editingId === task.id ? 'rgba(245,194,17,0.15)' : 'none',
                      border: editingId === task.id ? '1px solid rgba(245,194,17,0.35)' : 'none',
                      color: editingId === task.id ? 'var(--accent)' : 'var(--c-text-muted)',
                      cursor: 'pointer', padding: '6px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center',
                    }"
                    @click="editingId === task.id ? cancelEdit() : startEdit(task)"
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
                    @click="requestDelete(task.id)"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M2 4h11M5 4V2.5h5V4M6 7v4M9 7v4M3 4l.9 8.5a1 1 0 001 .9h6.2a1 1 0 001-.9L13 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </template>
              </div>
            </div>

            <!-- Inline edit form -->
            <div
              v-if="editingId === task.id"
              :style="{
                padding: '16px',
                borderBottom: i < tasks.length - 1 ? '1px solid var(--c-border)' : 'none',
                display: 'flex', flexDirection: 'column', gap: '14px',
                background: 'rgba(245,194,17,0.03)',
              }"
            >
              <!-- Icon + Title -->
              <div :style="{
                background: 'var(--c-bg1)', border: '1px solid var(--c-border)',
                borderRadius: '12px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '10px',
              }">
                <button
                  :style="{
                    width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                    background: 'rgba(245,194,17,0.13)',
                    border: showEmojiPicker ? '1px solid rgba(245,194,17,0.6)' : '1px solid rgba(245,194,17,0.25)',
                    fontSize: '22px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border-color 0.15s',
                  }"
                  @click="showEmojiPicker = !showEmojiPicker"
                >{{ editEmoji }}</button>
                <input
                  id="edit-title-input"
                  v-model="editTitle"
                  placeholder="Task name"
                  :style="{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: 'var(--c-text)', fontSize: '15px', fontWeight: 600,
                    fontFamily: 'inherit', caretColor: 'var(--accent)',
                  }"
                  @keydown.enter="saveEdit"
                  @keydown.esc="cancelEdit"
                />
              </div>

              <!-- Emoji picker -->
              <div
                v-if="showEmojiPicker"
                :style="{
                  background: 'var(--c-bg1)', border: '1px solid var(--c-border)',
                  borderRadius: '12px', padding: '12px',
                  maxHeight: '280px', overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                }"
              >
                <div v-for="cat in EMOJI_CATS" :key="cat.label">
                  <div :style="{
                    fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px',
                    color: 'var(--c-text-muted)', textTransform: 'uppercase',
                    marginBottom: '5px', paddingLeft: '2px',
                  }">{{ cat.label }}</div>
                  <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px' }">
                    <button
                      v-for="e in cat.emojis"
                      :key="e"
                      :style="{
                        background: editEmoji === e ? 'rgba(245,194,17,0.2)' : 'none',
                        border: editEmoji === e ? '1px solid rgba(245,194,17,0.5)' : '1px solid transparent',
                        borderRadius: '7px', padding: '5px 2px', fontSize: '18px', cursor: 'pointer',
                      }"
                      @click="editEmoji = e; showEmojiPicker = false"
                    >{{ e }}</button>
                  </div>
                </div>
              </div>

              <!-- Interval presets -->
              <div>
                <div :style="{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px',
                  color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: '8px',
                }">Repeats every</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button
                    v-for="n in INTERVAL_PRESETS"
                    :key="n"
                    :style="{
                      background: editIntervalDays === n
                        ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                        : 'var(--c-bg3)',
                      border: `1px solid ${editIntervalDays === n ? 'transparent' : 'var(--c-border)'}`,
                      borderRadius: '9px', padding: '6px 12px',
                      color: editIntervalDays === n ? '#0d0d14' : 'var(--c-text-sec)',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }"
                    @click="editIntervalDays = n"
                  >{{ intervalLabel(n) }}</button>
                </div>
                <div style="margin-top: 10px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-size: 11px; color: var(--c-text-muted);">Custom</span>
                    <span style="font-size: 12px; font-weight: 700; color: var(--accent);">
                      {{ editIntervalDays }} day{{ editIntervalDays !== 1 ? 's' : '' }}
                    </span>
                  </div>
                  <input v-model="editIntervalDays" type="range" min="1" max="90" style="width: 100%;" />
                </div>
              </div>

              <!-- Category -->
              <div>
                <div :style="{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px',
                  color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: '8px',
                }">Category</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button
                    v-for="cat in CATEGORIES"
                    :key="cat.key"
                    :style="{
                      background: editCategory === cat.key ? `${cat.color}22` : 'var(--c-bg3)',
                      border: `1px solid ${editCategory === cat.key ? cat.color + '55' : 'var(--c-border)'}`,
                      borderRadius: '9px', padding: '6px 12px',
                      color: editCategory === cat.key ? cat.color : 'var(--c-text-sec)',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }"
                    @click="editCategory = cat.key"
                  >{{ cat.label }}</button>
                </div>
              </div>

              <!-- Save / Cancel -->
              <div style="display: flex; gap: 8px;">
                <button
                  :disabled="!editTitle.trim()"
                  :style="{
                    flex: 1,
                    background: editTitle.trim() ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--c-bg3)',
                    border: 'none', borderRadius: '10px', padding: '10px',
                    color: editTitle.trim() ? '#0d0d14' : 'var(--c-text-muted)',
                    fontSize: '14px', fontWeight: 700,
                    cursor: editTitle.trim() ? 'pointer' : 'default',
                  }"
                  @click="saveEdit"
                >Save</button>
                <button
                  :style="{
                    background: 'none', border: '1px solid var(--c-border)',
                    borderRadius: '10px', padding: '10px 16px',
                    color: 'var(--c-text-muted)', fontSize: '14px', cursor: 'pointer',
                  }"
                  @click="cancelEdit"
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications section -->
      <div>
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase',
          marginBottom: '10px', paddingLeft: '4px',
        }">Notifications</div>

        <div :style="{
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: '16px', overflow: 'hidden',
        }">
          <div :style="{
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }">
            <div>
              <div style="font-size: 14px; font-weight: 600; color: var(--c-text);">
                Due reminders
              </div>
              <div style="font-size: 12px; color: var(--c-text-muted); margin-top: 2px;">
                <template v-if="notifPermission === 'granted'">
                  Active — checking for due tasks
                </template>
                <template v-else-if="notifPermission === 'denied'">
                  Blocked in browser settings
                </template>
                <template v-else>
                  Get notified when tasks are due
                </template>
              </div>
            </div>

            <!-- Granted -->
            <span
              v-if="notifPermission === 'granted'"
              :style="{
                fontSize: '12px', fontWeight: 700, padding: '4px 10px',
                borderRadius: '99px', color: '#2dd4bf',
                background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)',
                flexShrink: 0,
              }"
            >On ✓</span>

            <!-- Denied -->
            <span
              v-else-if="notifPermission === 'denied'"
              :style="{
                fontSize: '12px', fontWeight: 700, padding: '4px 10px',
                borderRadius: '99px', color: '#f87171',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                flexShrink: 0,
              }"
            >Blocked</span>

            <!-- Default — prompt -->
            <button
              v-else
              :style="{
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                border: 'none', borderRadius: '10px', padding: '7px 14px',
                color: '#0d0d14', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', flexShrink: 0,
              }"
              @click="enableNotifications"
            >Enable</button>
          </div>

          <!-- Periodic sync note -->
          <div
            v-if="notifPermission === 'granted'"
            :style="{
              padding: '12px 16px',
              borderTop: '1px solid var(--c-border)',
              fontSize: '12px', color: 'var(--c-text-muted)', lineHeight: 1.5,
            }"
          >
            <template v-if="periodicSyncSupported">
              🔄 Background checks enabled — you'll be notified even when the app is closed.
            </template>
            <template v-else>
              ⚡ Open the app daily to receive reminders — background sync is not supported by this browser.
            </template>
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
