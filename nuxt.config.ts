import tailwindcss from '@tailwindcss/vite'
import { version } from './package.json'

// @ts-ignore -- process.env is available at Nuxt build time (Node context)
const appBase: string = process.env.NUXT_APP_BASE_URL ?? '/Remembrall/'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,

  runtimeConfig: {
    public: { version },
  },

  app: {
    baseURL: appBase,
    head: {
      link: [
        { rel: 'manifest', href: `${appBase}manifest.webmanifest` },
        { rel: 'icon', type: 'image/x-icon', href: `${appBase}favicon.ico` },
        // iOS home-screen icons (Safari ignores the web manifest for these)
        { rel: 'apple-touch-icon', sizes: '180x180', href: `${appBase}icons/ios/180.png` },
        { rel: 'apple-touch-icon', sizes: '167x167', href: `${appBase}icons/ios/167.png` },
        { rel: 'apple-touch-icon', sizes: '152x152', href: `${appBase}icons/ios/152.png` },
        { rel: 'apple-touch-icon', sizes: '120x120', href: `${appBase}icons/ios/120.png` },
        { rel: 'apple-touch-icon', sizes: '76x76',   href: `${appBase}icons/ios/76.png` },
      ],
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
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
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
        // Standard sizes — browsers and Android pick the closest fit
        { src: `${appBase}icons/android/launchericon-48x48.png`,   sizes: '48x48',   type: 'image/png', purpose: 'any' },
        { src: `${appBase}icons/android/launchericon-72x72.png`,   sizes: '72x72',   type: 'image/png', purpose: 'any' },
        { src: `${appBase}icons/android/launchericon-96x96.png`,   sizes: '96x96',   type: 'image/png', purpose: 'any' },
        { src: `${appBase}icons/android/launchericon-144x144.png`, sizes: '144x144', type: 'image/png', purpose: 'any' },
        { src: `${appBase}icons/android/launchericon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: `${appBase}icons/android/launchericon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
        // Maskable variants (Android adaptive icons — safe area is the inner 80%)
        { src: `${appBase}icons/android/launchericon-192x192.png`, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: `${appBase}icons/android/launchericon-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
})
