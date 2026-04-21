<script setup lang="ts">
import { profile, BADGE_DEFS, TITLE_DEFS, xpToNextLevel } from '~/composables/useGamification'

definePageMeta({ pageTransition: { name: 'slide-right', mode: 'out-in' } })
useHead({ title: 'Profile – Remembrall' })

const { checkTitles } = useGamification()

// ── DB-backed stats ───────────────────────────────────────────
const unlockedBadgeIds = ref<Set<string>>(new Set())
const totalCompletions = ref(0)
const taskCount = ref(0)

onMounted(async () => {
  // Initialises profile.value as side-effect
  await checkTitles()

  const db = useDb()
  const [badges, completions, tasks] = await Promise.all([
    db.badges.toArray(),
    db.completions.where('type').equals('done').count(),
    db.tasks.count(),
  ])
  unlockedBadgeIds.value = new Set(badges.map(b => b.id))
  totalCompletions.value = completions
  taskCount.value = tasks
})

// ── XP bar ────────────────────────────────────────────────────
const xpData = computed(() => {
  if (!profile.value) return { pct: 0, current: 0, needed: 100, level: 1 }
  const { current, needed } = xpToNextLevel(profile.value.totalXp)
  return { pct: Math.min(100, (current / needed) * 100), current, needed, level: profile.value.level }
})

const currentTitleLabel = computed(() =>
  TITLE_DEFS.find(t => t.key === profile.value?.currentTitle)?.label ?? 'Newcomer',
)

// ── Badge helpers ─────────────────────────────────────────────
function isBadgeUnlocked(defId: string, perTask: boolean): boolean {
  if (!perTask) return unlockedBadgeIds.value.has(defId)
  for (const id of unlockedBadgeIds.value) {
    if (id.startsWith(defId + '-')) return true
  }
  return false
}

// ── Title picker ──────────────────────────────────────────────
const showTitlePicker = ref(false)
</script>

<template>
  <div :style="{ background: 'var(--c-bg0)', minHeight: '100vh', paddingBottom: '80px' }">

    <!-- Header -->
    <div :style="{
      padding: 'max(64px, calc(env(safe-area-inset-top) + 44px)) 20px 20px',
      background: 'linear-gradient(180deg, var(--c-bg1) 0%, var(--c-bg0) 100%)',
    }">
      <div style="font-size: 28px; font-weight: 800; color: var(--c-text); letter-spacing: -0.8px;">Profile</div>
      <div style="font-size: 13px; color: var(--c-text-muted); margin-top: 2px;">
        Your progress & achievements
      </div>
    </div>

    <div style="padding: 8px 16px; display: flex; flex-direction: column; gap: 20px;">

      <!-- Level card -->
      <div
        :style="{
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          borderRadius: '20px', padding: '20px',
        }"
      >
        <!-- Level number + title chip -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <div style="font-size: 13px; color: var(--c-text-muted); font-weight: 600; margin-bottom: 4px;">LEVEL</div>
            <div style="font-size: 48px; font-weight: 900; color: var(--c-text); letter-spacing: -2px; line-height: 1;">
              {{ xpData.level }}
            </div>
          </div>

          <!-- Title chip — tappable -->
          <button
            :style="{
              background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)',
              borderRadius: '99px', padding: '6px 14px',
              color: '#2dd4bf', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              marginTop: '4px',
            }"
            @click="showTitlePicker = true"
          >
            {{ currentTitleLabel }}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 4l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- XP progress bar -->
        <div style="height: 8px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden;">
          <div
            :style="{
              height: '100%',
              width: xpData.pct + '%',
              background: 'linear-gradient(90deg, #2dd4bf, #06b6d4)',
              borderRadius: '99px',
              transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            }"
          />
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 6px;">
          <span style="font-size: 11px; color: var(--c-text-muted);">{{ xpData.current }} XP</span>
          <span style="font-size: 11px; color: var(--c-text-muted);">{{ xpData.needed }} XP to Lv {{ xpData.level + 1 }}</span>
        </div>
      </div>

      <!-- Stats row -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
        <div
          v-for="stat in [
            { label: 'Completions', value: totalCompletions, icon: '✓' },
            { label: 'Best Streak', value: profile?.longestStreak ?? 0, icon: '🔥' },
            { label: 'Tasks', value: taskCount, icon: '📋' },
          ]"
          :key="stat.label"
          :style="{
            background: 'var(--c-surface)', border: '1px solid var(--c-border)',
            borderRadius: '16px', padding: '14px 12px', textAlign: 'center',
          }"
        >
          <div style="font-size: 20px; margin-bottom: 4px;">{{ stat.icon }}</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--c-text); letter-spacing: -0.5px;">{{ stat.value }}</div>
          <div style="font-size: 10px; color: var(--c-text-muted); letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px;">{{ stat.label }}</div>
        </div>
      </div>

      <!-- Badges section -->
      <div>
        <div :style="{
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
          color: 'var(--c-text-muted)', textTransform: 'uppercase',
          marginBottom: '10px', paddingLeft: '4px',
        }">Badges</div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          <div
            v-for="def in BADGE_DEFS"
            :key="def.id"
            :style="{
              borderRadius: '14px', padding: '14px 10px',
              textAlign: 'center',
              border: isBadgeUnlocked(def.id, def.perTask)
                ? '1px solid rgba(245,194,17,0.25)'
                : '1px solid var(--c-border)',
              background: isBadgeUnlocked(def.id, def.perTask)
                ? 'rgba(245,194,17,0.06)'
                : 'var(--c-surface)',
              opacity: isBadgeUnlocked(def.id, def.perTask) ? 1 : 0.45,
              transition: 'opacity 0.2s',
            }"
          >
            <div style="font-size: 26px; margin-bottom: 6px; line-height: 1;">
              {{ isBadgeUnlocked(def.id, def.perTask) ? def.icon : '???' }}
            </div>
            <div
              :style="{
                fontSize: '11px', fontWeight: 700, lineHeight: 1.3,
                color: isBadgeUnlocked(def.id, def.perTask) ? 'var(--c-text)' : 'var(--c-text-muted)',
              }"
            >{{ isBadgeUnlocked(def.id, def.perTask) ? def.label : '???' }}</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Title picker sheet -->
    <Transition name="sheet">
      <TitlePickerSheet v-if="showTitlePicker" @close="showTitlePicker = false" />
    </Transition>
  </div>
</template>
