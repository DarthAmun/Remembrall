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

  if ('serviceWorker' in navigator) {
    // Reload once when a new SW takes control so the page loads fresh assets.
    let reloading = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    })

    // Unregister stale SWs from old deploys with wrong scope.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        if (!reg.scope.includes(location.pathname.split('/')[1] || '/')) reg.unregister()
      }
    })
  }
})
