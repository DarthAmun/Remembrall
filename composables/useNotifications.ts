const _permission = ref<NotificationPermission>('default')
const _periodicSyncSupported = ref(false)

export function useNotifications() {
  onMounted(async () => {
    if (!('Notification' in window)) return
    _permission.value = Notification.permission
    const reg = await navigator.serviceWorker?.ready
    if (reg && 'periodicSync' in reg) _periodicSyncSupported.value = true
  })

  async function enable() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    _permission.value = result
    if (result !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    if ('periodicSync' in reg) {
      try {
        await (reg as any).periodicSync.register('check-tasks', {
          minInterval: 12 * 60 * 60 * 1000,
        })
      } catch { /* throttled or not permitted by browser */ }
    }
    // Trigger an immediate check so tasks due right now show up
    reg.active?.postMessage({ type: 'CHECK_TASKS' })
  }

  return {
    permission: _permission,
    periodicSyncSupported: _periodicSyncSupported,
    enable,
  }
}
