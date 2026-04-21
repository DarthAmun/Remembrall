<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/',         label: 'Home' },
  { to: '/profile',  label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]
</script>

<template>
  <nav
    :style="{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'stretch', justifyContent: 'space-around',
      background: 'var(--c-bg1)',
      borderTop: '1px solid var(--c-border)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }"
  >
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      :style="{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '3px', padding: '10px 0 12px',
        color: route.path === item.to ? '#2dd4bf' : 'var(--c-text-muted)',
        textDecoration: 'none',
        fontSize: '10px', fontWeight: 600,
        letterSpacing: '0.5px',
        transition: 'color 0.15s',
      }"
    >
      <!-- Home -->
      <svg v-if="item.to === '/'" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V9.5z"
          :stroke="route.path === '/' ? '#2dd4bf' : 'currentColor'"
          stroke-width="1.5" stroke-linejoin="round"
          :fill="route.path === '/' ? 'rgba(45,212,191,0.15)' : 'none'"
        />
      </svg>

      <!-- Profile -->
      <svg v-else-if="item.to === '/profile'" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11" cy="8" r="3.5"
          :stroke="route.path === '/profile' ? '#2dd4bf' : 'currentColor'"
          stroke-width="1.5"
        />
        <path
          d="M4 19c0-3.866 3.134-7 7-7s7 3.134 7 7"
          :stroke="route.path === '/profile' ? '#2dd4bf' : 'currentColor'"
          stroke-width="1.5" stroke-linecap="round"
        />
      </svg>

      <!-- Settings -->
      <svg v-else width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11" cy="11" r="3"
          :stroke="route.path === '/settings' ? '#2dd4bf' : 'currentColor'"
          stroke-width="1.5"
        />
        <path
          d="M17.7 8.4l-1-.6a6 6 0 00-.1-1.1l.9-.7a1 1 0 00.2-1.3L16.5 3a1 1 0 00-1.3-.2l-.9.5a6 6 0 00-1-.4L13 2a1 1 0 00-1 0h-2a1 1 0 00-.9.6l-.3 1a6 6 0 00-1 .4l-.9-.5a1 1 0 00-1.3.2L4.3 4.7a1 1 0 00.2 1.3l.9.7a6 6 0 00-.1 1.1l-1 .6A1 1 0 004 9.6V12a1 1 0 00.6.9l1 .5a6 6 0 00.4 1l-.5.9a1 1 0 00.2 1.3l1.7 1.7a1 1 0 001.3-.2l.7-.9a6 6 0 001.1.1l.6 1a1 1 0 00.9.6h2a1 1 0 00.9-.6l.5-1a6 6 0 001.1-.1l.7.9a1 1 0 001.3.2l1.7-1.7a1 1 0 00-.2-1.3l-.5-.9a6 6 0 00.4-1l1-.5A1 1 0 0018 12V9.6a1 1 0 00-.3-.7l-1-.5z"
          :stroke="route.path === '/settings' ? '#2dd4bf' : 'currentColor'"
          stroke-width="1.4" stroke-linejoin="round"
        />
      </svg>

      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
