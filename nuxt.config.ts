import tailwindcss from '@tailwindcss/vite'

// @ts-ignore -- process.env is available at Nuxt build time (Node context)
const appBase: string = process.env.NUXT_APP_BASE_URL ?? '/'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,

  app: {
    baseURL: appBase,
    head: {
      link: [{ rel: 'icon', type: 'image/x-icon', href: `${appBase}favicon.ico` }],
    },
  },

  typescript: {
    strict: true,
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  modules: ['@vite-pwa/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Remembrall',
      short_name: 'Remembrall',
      description: 'Never forget a thing.',
      theme_color: '#0d0d14',
      background_color: '#0d0d14',
      display: 'standalone',
      orientation: 'portrait',
      scope: appBase,
      start_url: appBase,
      icons: [
        {
          src: `${appBase}icons/icon-192x192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${appBase}icons/icon-192x192.png`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: `${appBase}icons/icon-512x512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${appBase}icons/icon-512x512.png`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: appBase,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'images-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        {
          urlPattern: /\/api\/.*/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'api-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
