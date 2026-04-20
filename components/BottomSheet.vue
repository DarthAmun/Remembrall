<script setup lang="ts">
import type { Task } from '~/composables/useDb'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{
  close: []
  done: []
  snooze: [ms: number]
  skip: []
}>()

const snoozeMode = ref(false)
const customVal = ref('')

const color = computed(() => catColor(props.task.category))
const offset = computed(() => daysOffset(props.task.nextDue))

function handleSnoozePreset(ms: number) {
  emit('snooze', ms)
}

function handleCustomSnooze() {
  const ms = parseSnooze(customVal.value)
  if (ms > 0) emit('snooze', ms)
}

function close() {
  snoozeMode.value = false
  customVal.value = ''
  emit('close')
}
</script>

<template>
  <div
    style="position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; justify-content: flex-end;"
  >
    <!-- Backdrop -->
    <div
      class="sheet-backdrop"
      style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);"
      @click="close"
    />

    <!-- Panel -->
    <div
      class="sheet-panel"
      :style="{
        position: 'relative',
        zIndex: 1,
        background: 'var(--c-bg1)',
        borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--c-border-med)',
        paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
      }"
    >
      <!-- Handle -->
      <div style="display: flex; justify-content: center; padding: 12px 0 8px;">
        <div style="width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.2);" />
      </div>

      <!-- Task preview -->
      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 20px 16px',
          borderBottom: '1px solid var(--c-border)',
        }"
      >
        <div
          :style="{
            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
            background: `${color}22`,
            border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
          }"
        >{{ task.icon }}</div>
        <div>
          <div style="font-size: 16px; font-weight: 700; color: var(--c-text);">{{ task.title }}</div>
          <StatusBadge :status="task.status" :days-offset="offset" />
        </div>
      </div>

      <!-- Main actions -->
      <div v-if="!snoozeMode" style="padding: 16px 16px 0; display: flex; flex-direction: column; gap: 10px;">

        <!-- Done -->
        <button
          style="
            border: none; border-radius: 14px; padding: 16px;
            display: flex; align-items: center; gap: 12px; cursor: pointer;
            transition: transform 0.1s; width: 100%; text-align: left;
            background: linear-gradient(135deg, var(--accent2), color-mix(in srgb, var(--accent2) 73%, transparent));
          "
          @mousedown="($el as HTMLElement).style.transform = 'scale(0.97)'"
          @mouseup="($el as HTMLElement).style.transform = 'scale(1)'; emit('done')"
          @mouseleave="($el as HTMLElement).style.transform = 'scale(1)'"
          @touchstart.passive="($el as HTMLElement).style.transform = 'scale(0.97)'"
          @touchend="($el as HTMLElement).style.transform = 'scale(1)'; emit('done')"
        >
          <div
            style="
              width: 36px; height: 36px; border-radius: 10px;
              background: rgba(0,0,0,0.2);
              display: flex; align-items: center; justify-content: center; font-size: 18px;
            "
          >✓</div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: #0d2420;">Mark as Done</div>
            <div style="font-size: 12px; color: rgba(0,36,28,0.6);">Resets the timer</div>
          </div>
        </button>

        <!-- Snooze -->
        <button
          :style="{
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: '14px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
            transition: 'transform 0.1s', width: '100%', textAlign: 'left',
          }"
          @mousedown="($el as HTMLElement).style.transform = 'scale(0.97)'"
          @mouseup="($el as HTMLElement).style.transform = 'scale(1)'; snoozeMode = true"
          @mouseleave="($el as HTMLElement).style.transform = 'scale(1)'"
          @touchstart.passive="($el as HTMLElement).style.transform = 'scale(0.97)'"
          @touchend="($el as HTMLElement).style.transform = 'scale(1)'; snoozeMode = true"
        >
          <div
            :style="{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `rgba(245,194,17,0.13)`,
              border: `1px solid rgba(245,194,17,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }"
          >⏱</div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--c-text);">Remind me in…</div>
            <div style="font-size: 12px; color: var(--c-text-sec);">Snooze for a bit</div>
          </div>
          <svg style="margin-left: auto;" width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M1 1l6 6-6 6" stroke="rgba(210,210,255,0.35)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Skip -->
        <button
          :style="{
            background: 'transparent',
            border: '1px solid var(--c-border)',
            borderRadius: '14px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
            transition: 'transform 0.1s', width: '100%', textAlign: 'left',
          }"
          @mousedown="($el as HTMLElement).style.transform = 'scale(0.97)'"
          @mouseup="($el as HTMLElement).style.transform = 'scale(1)'; emit('skip')"
          @mouseleave="($el as HTMLElement).style.transform = 'scale(1)'"
          @touchstart.passive="($el as HTMLElement).style.transform = 'scale(0.97)'"
          @touchend="($el as HTMLElement).style.transform = 'scale(1)'; emit('skip')"
        >
          <div
            style="
              width: 36px; height: 36px; border-radius: 10px;
              background: rgba(255,255,255,0.05);
              display: flex; align-items: center; justify-content: center; font-size: 18px;
            "
          >⏩</div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--c-text-sec);">Skip</div>
            <div style="font-size: 12px; color: var(--c-text-muted);">Next due date stays</div>
          </div>
        </button>
      </div>

      <!-- Snooze picker -->
      <div v-else style="padding: 16px 16px 0;">
        <!-- Back -->
        <button
          style="
            background: none; border: none; color: var(--accent);
            font-size: 14px; font-weight: 600; cursor: pointer;
            padding: 0 0 12px; display: flex; align-items: center; gap: 4px;
          "
          @click="snoozeMode = false"
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
            <path d="M7 1L1 7l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back
        </button>

        <div
          style="
            font-size: 13px; font-weight: 700; color: var(--c-text-muted);
            letter-spacing: 1px; margin-bottom: 10px;
          "
        >SNOOZE FOR</div>

        <!-- Quick options -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <button
            v-for="opt in SNOOZE_PRESETS"
            :key="opt.ms"
            :style="{
              background: 'var(--c-surface)',
              border: '1px solid var(--c-border)',
              borderRadius: '12px', padding: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.1s',
            }"
            @mouseenter="($el as HTMLElement).style.borderColor = 'var(--accent)'; ($el as HTMLElement).style.background = 'rgba(245,194,17,0.07)'"
            @mouseleave="($el as HTMLElement).style.borderColor = 'var(--c-border)'; ($el as HTMLElement).style.background = 'var(--c-surface)'"
            @click="handleSnoozePreset(opt.ms)"
          >
            <span style="font-size: 18px;">{{ opt.icon }}</span>
            <span style="font-size: 13px; font-weight: 600; color: var(--c-text);">{{ opt.label }}</span>
          </button>
        </div>

        <!-- Custom input -->
        <div
          :style="{
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)',
            borderRadius: '12px', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }"
        >
          <span style="font-size: 18px;">✏️</span>
          <input
            v-model="customVal"
            placeholder="Custom: e.g. 3h, 5d, 2w"
            :style="{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--c-text)', fontSize: '14px', fontFamily: 'inherit',
              caretColor: 'var(--accent)',
            }"
          />
          <button
            v-if="customVal"
            :style="{
              background: 'var(--accent)', border: 'none', borderRadius: '8px',
              padding: '6px 12px', color: '#0d0d14', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            }"
            @click="handleCustomSnooze"
          >Set</button>
        </div>
      </div>
    </div>
  </div>
</template>
