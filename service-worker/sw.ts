import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// SPA fallback — all navigations serve index.html
registerRoute(new NavigationRoute(
  createHandlerBoundToURL(import.meta.env.BASE_URL + 'index.html'),
))

// Image runtime caching
registerRoute(
  /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
)

// ── Periodic background sync ───────────────────────────────────
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'check-tasks') {
    event.waitUntil(checkAndNotify())
  }
})

// ── Manual trigger from the app ────────────────────────────────
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'CHECK_TASKS') {
    checkAndNotify()
  }
})

// ── Notification tap → focus or open app ──────────────────────
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? self.registration.scope
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const existing = clients.find(c => c.url.startsWith(self.registration.scope))
        return existing ? existing.focus() : self.clients.openWindow(url)
      }),
  )
})

// ── Core notification logic ────────────────────────────────────
async function checkAndNotify(): Promise<void> {
  // Skip if the app window is already focused
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  if (clients.some(c => c.focused)) return

  const tasks = await getDueTasks()
  if (tasks.length === 0) return

  const scope = self.registration.scope
  const title = tasks.length === 1
    ? `${tasks[0].icon} ${tasks[0].title}`
    : `${tasks.length} tasks need attention`
  const body = tasks.length === 1
    ? 'Tap to open Remembrall'
    : tasks.slice(0, 3).map(t => `${t.icon} ${t.title}`).join('  ·  ')

  await self.registration.showNotification(title, {
    body,
    icon: scope + 'icons/android/launchericon-192x192.png',
    badge: scope + 'icons/android/launchericon-96x96.png',
    tag: 'remembrall-due',
    renotify: true,
    data: { url: scope },
  })
}

// ── Read due tasks directly from IndexedDB ────────────────────
interface DueTask { id: string; title: string; icon: string }

function getDueTasks(): Promise<DueTask[]> {
  return new Promise(resolve => {
    const req = indexedDB.open('remembrall')
    req.onerror = () => resolve([])
    req.onsuccess = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('tasks')) { db.close(); resolve([]); return }
      const all = db.transaction('tasks', 'readonly').objectStore('tasks').getAll()
      all.onerror = () => { db.close(); resolve([]) }
      all.onsuccess = () => {
        const now = Date.now()
        resolve(
          (all.result as any[]).filter(t =>
            (t.status === 'due' || t.status === 'overdue') &&
            (!t.snoozeUntil || t.snoozeUntil <= now),
          ),
        )
        db.close()
      }
    }
  })
}
