<script setup lang="ts">
import type { UnlockedBadge } from '~/composables/useGamification'

const props = defineProps<{
  xpEarned: number
  newBadges: UnlockedBadge[]
  streak: number
  leveledUp: boolean
  newLevel: number
}>()

const emit = defineEmits<{ close: [] }>()

// ── Count-up animation ────────────────────────────────────────
const displayXp = ref(0)
onMounted(() => {
  const target = props.xpEarned
  if (target <= 0) { displayXp.value = 0; return }
  const duration = 1100
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - t, 3)   // ease-out cubic
    displayXp.value = Math.round(target * eased)
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

// ── Auto-close after 4 s ─────────────────────────────────────
const progress = ref(100)  // bar goes 100 → 0 over 4s
let closeTimer: ReturnType<typeof setTimeout> | null = null
let progressTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  const TOTAL = 4000
  const TICK = 50
  const step = (TICK / TOTAL) * 100
  progressTimer = setInterval(() => { progress.value = Math.max(0, progress.value - step) }, TICK)
  closeTimer = setTimeout(() => emit('close'), TOTAL)
})
onUnmounted(() => {
  if (closeTimer) clearTimeout(closeTimer)
  if (progressTimer) clearInterval(progressTimer)
})

// ── Confetti pieces (CSS-only, generated once) ────────────────
const showConfetti = props.leveledUp || props.newBadges.length > 0
const CONFETTI_COLORS = ['#2dd4bf', '#f5c211', '#a78bfa', '#f472b6', '#34d399', '#60a5fa', '#fb923c']
const confettiPieces = showConfetti
  ? Array.from({ length: 28 }, (_, i) => {
      const angle = ((i / 28) * Math.PI * 2) + (Math.random() * 0.4)
      const r = 70 + Math.random() * 90
      return {
        key: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        cx: `${Math.cos(angle) * r}px`,
        cy: `${-Math.abs(Math.sin(angle) * r) - 10}px`,
        cr: `${(Math.random() - 0.5) * 600}deg`,
        delay: `${i * 28}ms`,
        size: `${3 + Math.random() * 5}px`,
        round: i % 3 !== 0,
      }
    })
  : []

// ── Toast queue for badges ────────────────────────────────────
const toastQueue = ref<UnlockedBadge[]>([])
const activeToast = ref<UnlockedBadge | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function advanceToast() {
  if (toastQueue.value.length === 0) { activeToast.value = null; return }
  activeToast.value = toastQueue.value.shift()!
  toastTimer = setTimeout(() => { activeToast.value = null; nextTick(advanceToast) }, 3200)
}

onMounted(() => {
  if (props.newBadges.length > 0) {
    toastQueue.value = [...props.newBadges]
    setTimeout(advanceToast, 600) // slight delay so count-up starts first
  }
})
onUnmounted(() => { if (toastTimer) clearTimeout(toastTimer) })
</script>

<template>
  <div style="position: fixed; inset: 0; z-index: 110; display: flex; flex-direction: column; justify-content: flex-end;">
    <!-- Backdrop -->
    <div
      class="sheet-backdrop"
      style="position: absolute; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);"
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
        paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
        overflow: 'hidden',
      }"
    >
      <!-- Confetti particles (CSS-only, positioned from centre of panel) -->
      <div
        v-if="showConfetti"
        style="position: absolute; top: 60px; left: 50%; pointer-events: none; z-index: 0;"
      >
        <div
          v-for="p in confettiPieces"
          :key="p.key"
          :style="{
            position: 'absolute',
            width: p.size, height: p.size,
            borderRadius: p.round ? '50%' : '2px',
            background: p.color,
            '--cx': p.cx, '--cy': p.cy, '--cr': p.cr,
            animation: `confettiFall 0.9s ease-out ${p.delay} both`,
            transformOrigin: 'center',
          } as any"
        />
      </div>

      <!-- Handle -->
      <div style="display: flex; justify-content: center; padding: 12px 0 4px; position: relative; z-index: 1;">
        <div style="width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.18);" />
      </div>

      <!-- Close button -->
      <button
        style="
          position: absolute; top: 14px; right: 16px; z-index: 2;
          background: none; border: none; color: var(--c-text-muted);
          font-size: 20px; cursor: pointer; line-height: 1; padding: 4px;
        "
        @click="emit('close')"
      >×</button>

      <!-- Content -->
      <div style="padding: 12px 20px 0; position: relative; z-index: 1; display: flex; flex-direction: column; gap: 16px;">

        <!-- XP earned -->
        <div style="text-align: center; padding: 8px 0;">
          <div
            :style="{
              fontSize: '52px', fontWeight: 800, letterSpacing: '-2px',
              color: '#2dd4bf',
              textShadow: '0 0 30px rgba(45,212,191,0.45)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }"
          >+{{ displayXp }}</div>
          <div style="font-size: 14px; color: var(--c-text-muted); margin-top: 4px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
            XP Earned
          </div>
        </div>

        <!-- Stats row: streak + level -->
        <div style="display: flex; gap: 10px; justify-content: center;">
          <div
            v-if="streak > 0"
            :style="{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
              borderRadius: '12px', padding: '8px 14px',
            }"
          >
            <span style="font-size: 20px;">🔥</span>
            <div>
              <div style="font-size: 17px; font-weight: 800; color: #fb923c; line-height: 1;">{{ streak }}</div>
              <div style="font-size: 10px; color: var(--c-text-muted); letter-spacing: 0.5px;">DAY STREAK</div>
            </div>
          </div>

          <div
            v-if="leveledUp"
            :style="{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: '12px', padding: '8px 14px',
              animation: 'levelPulse 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
            }"
          >
            <span style="font-size: 20px;">⬆️</span>
            <div>
              <div style="font-size: 17px; font-weight: 800; color: #a78bfa; line-height: 1;">Lv {{ newLevel }}</div>
              <div style="font-size: 10px; color: var(--c-text-muted); letter-spacing: 0.5px;">LEVEL UP!</div>
            </div>
          </div>
        </div>

        <!-- New badges -->
        <div v-if="newBadges.length > 0">
          <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: var(--c-text-muted); text-transform: uppercase; margin-bottom: 8px;">
            Badge{{ newBadges.length > 1 ? 's' : '' }} Unlocked
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <div
              v-for="badge in newBadges"
              :key="badge.id"
              :style="{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(245,194,17,0.08)', border: '1px solid rgba(245,194,17,0.2)',
                borderRadius: '12px', padding: '8px 12px', flex: '1', minWidth: '140px',
              }"
            >
              <span style="font-size: 22px;">{{ badge.icon }}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--c-text);">{{ badge.label }}</div>
                <div style="font-size: 11px; color: var(--accent); font-weight: 600;">+{{ badge.xp }} XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-close progress bar -->
      <div style="margin-top: 20px; height: 3px; background: rgba(255,255,255,0.06);">
        <div
          :style="{
            height: '100%',
            width: progress + '%',
            background: 'rgba(45,212,191,0.4)',
            transition: 'width 0.05s linear',
          }"
        />
      </div>
    </div>

    <!-- Badge toast (above this sheet) -->
    <Transition name="toast">
      <BadgeToast
        v-if="activeToast"
        :badge="activeToast"
        style="position: absolute; bottom: 100%; left: 16px; right: 16px; margin-bottom: 12px;"
        @dismiss="activeToast = null; advanceToast()"
      />
    </Transition>
  </div>
</template>
