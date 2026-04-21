interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level ref so InstallBanner can read it regardless of when it mounts.
export const _deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)

export default defineNuxtPlugin(() => {
  window.addEventListener(
    'beforeinstallprompt',
    (e: Event) => {
      e.preventDefault()
      _deferredPrompt.value = e as BeforeInstallPromptEvent
    },
    { once: true },
  )

  // Unregister any stale service workers outside our current scope
  // (e.g. from a previous deploy with wrong NUXT_APP_BASE_URL).
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        const swScope = reg.scope
        if (!swScope.includes(location.pathname.split('/')[1] || '/')) {
          reg.unregister()
        }
      }
    })
  }
})
