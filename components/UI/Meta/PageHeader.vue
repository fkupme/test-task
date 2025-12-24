<template>
  <header class="page-header" role="banner">
    <div class="left-cluster">
      <img :src="logoLeft" alt="logo" class="app-logo" />

      <nav class="breadcrumbs" aria-label="Хлебные крошки">
        <span class="crumb leading">
          <img :src="gearIcon" alt="settings" class="gear" />
        </span>
        <template v-for="(bc, idx) in computedBreadcrumbs" :key="idx + bc.label">
          <span v-if="idx > 0" class="sep" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="sep-icon"><path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <NuxtLink
            :to="bc.to || undefined"
            class="crumb"
            :class="{ current: idx === computedBreadcrumbs.length - 1 }"
            :aria-current="idx === computedBreadcrumbs.length - 1 ? 'page' : undefined"
          >
            {{ bc.label }}
          </NuxtLink>
        </template>
      </nav>
    </div>

    <div class="right-cluster">
      <img :src="logoRight" alt="brand" class="brand-logo" />
    </div>
  </header>
</template>

<script setup lang="ts">
import type { RouteLocationMatched } from 'vue-router';

const props = defineProps<{
  title?: string
  icon?: string
  breadcrumbs?: Array<{ label: string; to?: string }>
}>()

const route = useRoute()

const logoLeft = new URL("@/assets/icons/toolbar/logo-left.svg", import.meta.url).href
const logoRight = new URL("@/assets/icons/toolbar/logo-right.svg", import.meta.url).href
const gearIcon = computed(() => {
  const explicit = props.icon || (route.meta?.icon as string)
  const fallback = "@/assets/icons/sidebar/tools.svg"
  const icon = explicit || fallback
  try {
    if (icon.startsWith('http') || icon.startsWith('/')) return icon
    return new URL(icon, import.meta.url).href
  } catch {
    return new URL(fallback, import.meta.url).href
  }
})

const computedBreadcrumbs = computed(() => {
  if (props.breadcrumbs?.length) return props.breadcrumbs
  const matched = (route.matched as RouteLocationMatched[]) || []
  const crumbs: Array<{ label: string; to?: string }> = []
  matched.forEach((m, idx) => {
    if (!m.path || m.path === '/') return
    const label = (m.meta?.breadcrumb as string) || (m.meta?.title as string) || (m.name?.toString() || '')
    if (!label) return
    const to = idx < matched.length - 1 ? m.path : undefined
    crumbs.push({ label, to })
  })
  if (!crumbs.length) {
    const label = props.title || (route.meta?.title as string) || (route.name?.toString() || '')
    if (label) crumbs.push({ label })
  }
  return crumbs
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #ffffff;
}
.left-cluster { display: flex; align-items: center; gap: 12px; min-width: 0; }
.right-cluster { display: flex; align-items: center; }

.app-logo { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.brand-logo { width: 28px; height: 28px; }

.breadcrumbs { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
.crumb {
  color: #111;
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}
.crumb.leading { display: inline-flex; align-items: center; }
.crumb.current { pointer-events: none; }

.gear { width: 18px; height: 18px; opacity: 0.9; }

.sep { display: inline-flex; align-items: center; color: #8f9aa3; }
.sep-icon { width: 16px; height: 16px; }
</style> 