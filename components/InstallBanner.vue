<script setup lang="ts">
// Captures the browser's deferred install prompt and shows a custom banner.
// iOS doesn't fire beforeinstallprompt so we detect it separately and show
// Share-sheet instructions instead.

const DISMISS_KEY = 'remembrall-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const show = ref(false)
const isIOS = ref(false)
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

onMounted(() => {
  // Already installed → never show
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  if (standalone) return

  // Previously dismissed → never show again
  if (localStorage.getItem(DISMISS_KEY)) return

  // Only meaningful on touch / narrow devices
  const isMobile = window.innerWidth < 900 || navigator.maxTouchPoints > 0
  if (!isMobile) return

  const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  if (iosDevice) {
    // iOS: no install event — show Share → Add to Home Screen instructions
    isIOS.value = true
    show.value = true
    return
  }

  // Android / Chrome: wait for the browser's event
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    show.value = true
  }, { once: true })
})

function dismiss() {
  show.value = false
  localStorage.setItem(DISMISS_KEY, '1')
}

async function install() {
  if (!deferredPrompt.value) return
  await deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  deferredPrompt.value = null
  if (outcome === 'accepted') show.value = false
}
</script>

<template>
  <Transition name="banner">
    <div
      v-if="show"
      :style="{
        position: 'fixed',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        left: '16px',
        right: '16px',
        zIndex: 200,
        background: 'var(--c-bg1)',
        border: '1px solid var(--c-border-med)',
        borderRadius: '18px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }"
    >
      <!-- App icon -->
      <div
        :style="{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
        }"
      >🔮</div>

      <!-- Text -->
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 14px; font-weight: 700; color: var(--c-text);">
          {{ isIOS ? 'Add to Home Screen' : 'Install Remembrall' }}
        </div>
        <div style="font-size: 12px; color: var(--c-text-muted); margin-top: 2px; line-height: 1.4;">
          <template v-if="isIOS">
            Tap <strong style="color: var(--c-text-sec);">Share</strong> then
            <strong style="color: var(--c-text-sec);">"Add to Home Screen"</strong>
          </template>
          <template v-else>
            Works offline · feels like a native app
          </template>
        </div>
      </div>

      <!-- Install button (Android) or just a dismiss (iOS) -->
      <button
        v-if="!isIOS"
        :style="{
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          border: 'none', borderRadius: '10px',
          padding: '8px 14px', color: '#0d0d14',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          flexShrink: 0, whiteSpace: 'nowrap',
        }"
        @click="install"
      >Install</button>

      <!-- Dismiss -->
      <button
        :style="{
          background: 'none', border: 'none',
          color: 'var(--c-text-muted)', cursor: 'pointer',
          padding: '4px', flexShrink: 0, lineHeight: 1,
          fontSize: '18px',
        }"
        :aria-label="'Dismiss install banner'"
        @click="dismiss"
      >×</button>
    </div>
  </Transition>
</template>
