<script setup lang="ts">
definePageMeta({ pageTransition: { name: 'slide-right', mode: 'out-in' } })
useHead({ title: 'New Task – Remembrall' })

const { addTask } = useTasks()

const emoji = ref('🍊')
const title = ref('')
const intervalDays = ref(7)
const category = ref('health')
const showEmojiPicker = ref(false)

const EMOJI_OPTS = ['🍊','🌱','📞','🧾','🏋️','🧹','📖','🦷','🧃','🧘','💊','✏️','🎵','🎯','🌙']
const INTERVAL_PRESETS = [1, 2, 3, 7, 14, 30]

function intervalLabel(n: number) {
  if (n === 1) return 'Daily'
  if (n === 7) return 'Weekly'
  if (n === 14) return '2 weeks'
  if (n === 30) return 'Monthly'
  return `${n} days`
}

async function submit() {
  if (!title.value.trim()) return
  await addTask({ icon: emoji.value, title: title.value.trim(), intervalDays: intervalDays.value, category: category.value })
  navigateTo('/')
}
</script>

<template>
  <div :style="{ background: 'var(--c-bg0)', minHeight: '100vh', paddingBottom: '40px' }">

    <!-- Nav -->
    <div :style="{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'max(64px, calc(env(safe-area-inset-top) + 44px)) 16px 16px',
      background: 'linear-gradient(180deg, var(--c-bg1) 0%, var(--c-bg0) 100%)',
    }">
      <button
        :style="{
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: '10px', padding: '8px 14px',
          color: 'var(--c-text-sec)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }"
        @click="navigateTo('/')"
      >
        <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
          <path d="M7 1L1 6.5L7 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>

      <div style="font-size: 16px; font-weight: 700; color: var(--c-text);">New Task</div>

      <button
        :disabled="!title.trim()"
        :style="{
          background: title.trim() ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--c-surface)',
          border: 'none', borderRadius: '10px', padding: '8px 16px',
          color: title.trim() ? '#0d0d14' : 'var(--c-text-muted)',
          fontSize: '14px', fontWeight: 700,
          cursor: title.trim() ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }"
        @click="submit"
      >Add</button>
    </div>

    <div style="padding: 8px 16px; display: flex; flex-direction: column; gap: 16px;">

      <!-- Icon + Title -->
      <div :style="{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: '16px', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }">
        <button
          :style="{
            width: '48px', height: '48px', borderRadius: '13px', flexShrink: 0,
            background: 'rgba(245,194,17,0.13)',
            border: '1px solid rgba(245,194,17,0.25)',
            fontSize: '24px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }"
          @click="showEmojiPicker = !showEmojiPicker"
        >{{ emoji }}</button>
        <input
          v-model="title"
          placeholder="What do you want to remember?"
          autofocus
          :style="{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--c-text)', fontSize: '15px', fontWeight: 600,
            fontFamily: 'inherit', caretColor: 'var(--accent)',
          }"
        />
      </div>

      <!-- Emoji picker -->
      <div
        v-if="showEmojiPicker"
        :style="{
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: '14px', padding: '12px',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px',
        }"
      >
        <button
          v-for="e in EMOJI_OPTS"
          :key="e"
          :style="{
            background: emoji === e ? 'rgba(245,194,17,0.2)' : 'none',
            border: emoji === e ? '1px solid rgba(245,194,17,0.5)' : '1px solid transparent',
            borderRadius: '10px', padding: '8px', fontSize: '22px', cursor: 'pointer',
          }"
          @click="emoji = e; showEmojiPicker = false"
        >{{ e }}</button>
      </div>

      <!-- Interval -->
      <div :style="{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: '16px', padding: '16px',
      }">
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: '12px',
        }">Repeats every</div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button
            v-for="n in INTERVAL_PRESETS"
            :key="n"
            :style="{
              background: intervalDays === n
                ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                : 'var(--c-bg3)',
              border: `1px solid ${intervalDays === n ? 'transparent' : 'var(--c-border)'}`,
              borderRadius: '10px', padding: '8px 14px',
              color: intervalDays === n ? '#0d0d14' : 'var(--c-text-sec)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: intervalDays === n ? '0 4px 12px rgba(245,194,17,0.3)' : 'none',
            }"
            @click="intervalDays = n"
          >{{ intervalLabel(n) }}</button>
        </div>

        <div style="margin-top: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 12px; color: var(--c-text-muted);">Custom</span>
            <span style="font-size: 13px; font-weight: 700; color: var(--accent);">
              {{ intervalDays }} day{{ intervalDays !== 1 ? 's' : '' }}
            </span>
          </div>
          <input
            v-model="intervalDays"
            type="range" min="1" max="90"
            style="width: 100%;"
          />
        </div>
      </div>

      <!-- Category -->
      <div :style="{
        background: 'var(--c-surface)', border: '1px solid var(--c-border)',
        borderRadius: '16px', padding: '16px',
      }">
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: '12px',
        }">Category</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.key"
            :style="{
              background: category === cat.key ? `${cat.color}22` : 'var(--c-bg3)',
              border: `1px solid ${category === cat.key ? cat.color + '55' : 'var(--c-border)'}`,
              borderRadius: '10px', padding: '8px 14px',
              color: category === cat.key ? cat.color : 'var(--c-text-sec)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }"
            @click="category = cat.key"
          >{{ cat.label }}</button>
        </div>
      </div>

      <!-- Preview card -->
      <div v-if="title.trim()">
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase', marginBottom: '8px',
        }">Preview</div>
        <TaskCard
          :task="{
            id: 'preview',
            icon: emoji,
            title: title,
            category: category,
            status: 'idle',
            baseInterval: intervalDays * 86_400_000,
            learnedInterval: intervalDays * 86_400_000,
            nextDue: Date.now() + intervalDays * 86_400_000,
            snoozeUntil: null,
            createdAt: Date.now(),
          }"
        />
      </div>
    </div>
  </div>
</template>
