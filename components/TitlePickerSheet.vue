<script setup lang="ts">
import { profile, TITLE_DEFS } from '~/composables/useGamification'

const emit = defineEmits<{ close: [] }>()

const equipping = ref<string | null>(null)

const unlockedTitles = computed(() =>
  TITLE_DEFS.filter(d => profile.value?.unlockedTitles.includes(d.key)),
)

async function equipTitle(key: string) {
  if (equipping.value) return
  equipping.value = key
  try {
    await useDb().profile.update('me', { currentTitle: key })
    if (profile.value) profile.value = { ...profile.value, currentTitle: key }
    emit('close')
  } finally {
    equipping.value = null
  }
}
</script>

<template>
  <div style="position: fixed; inset: 0; z-index: 120; display: flex; flex-direction: column; justify-content: flex-end;">
    <!-- Backdrop -->
    <div
      class="sheet-backdrop"
      style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);"
      @click="emit('close')"
    />

    <!-- Panel -->
    <div
      class="sheet-panel"
      :style="{
        position: 'relative', zIndex: 1,
        background: 'var(--c-bg1)',
        borderRadius: '24px 24px 0 0',
        borderTop: '1px solid var(--c-border-med)',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
        maxHeight: '70vh',
        display: 'flex', flexDirection: 'column',
      }"
    >
      <!-- Handle -->
      <div style="display: flex; justify-content: center; padding: 12px 0 4px; flex-shrink: 0;">
        <div style="width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.18);" />
      </div>

      <!-- Header -->
      <div style="padding: 4px 20px 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
        <div style="font-size: 17px; font-weight: 800; color: var(--c-text); letter-spacing: -0.3px;">Choose Title</div>
        <button
          style="background: none; border: none; color: var(--c-text-muted); font-size: 20px; cursor: pointer; padding: 4px;"
          @click="emit('close')"
        >×</button>
      </div>

      <!-- Title list -->
      <div style="overflow-y: auto; padding: 0 16px; display: flex; flex-direction: column; gap: 8px;">
        <button
          v-for="title in unlockedTitles"
          :key="title.key"
          :style="{
            background: profile?.currentTitle === title.key
              ? 'rgba(45,212,191,0.1)'
              : 'var(--c-surface)',
            border: `1px solid ${profile?.currentTitle === title.key ? 'rgba(45,212,191,0.35)' : 'var(--c-border)'}`,
            borderRadius: '14px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            transition: 'background 0.15s, border-color 0.15s',
            opacity: equipping === title.key ? 0.6 : 1,
          }"
          @click="equipTitle(title.key)"
        >
          <span
            :style="{
              fontSize: '15px', fontWeight: 700,
              color: profile?.currentTitle === title.key ? '#2dd4bf' : 'var(--c-text)',
            }"
          >{{ title.label }}</span>
          <svg
            v-if="profile?.currentTitle === title.key"
            width="18" height="18" viewBox="0 0 18 18" fill="none"
          >
            <circle cx="9" cy="9" r="8" fill="rgba(45,212,191,0.15)" stroke="#2dd4bf" stroke-width="1.5"/>
            <path d="M5.5 9l2.5 2.5 5-5" stroke="#2dd4bf" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
