<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/notes', icon: 'notes', label: 'Notes' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
] as const
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[var(--color-surface)] safe-area-bottom"
    :style="{ height: 'var(--bottom-nav-height)' }"
  >
    <NuxtLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors"
      :class="
        route.path === item.to
          ? 'text-[var(--color-primary)]'
          : 'text-[var(--color-text-muted)]'
      "
    >
      <span class="material-icons text-xl">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
