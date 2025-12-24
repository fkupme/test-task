<template>
  <div class="info-section">
    <div class="info-section__header">
      <div class="info-section__title">
        <span v-if="icon && !hasIconSlot" class="info-section__icon-wrapper">
          <Icon v-if="isSidebarIcon" :icon="icon" class="info-section__icon" />
          <component :is="icon" v-else-if="isComponentIcon" class="info-section__icon" />
          <img v-else :src="icon" alt="icon" class="info-section__icon-image" />
        </span>
        <slot v-else name="icon" />
        <span class="info-section__label">{{ label }}</span>
      </div>
      <slot name="append" />
    </div>
    <div class="info-section__values" :style="{ flexDirection: valuesDirection }">
      <span v-for="(value, i) in values" :key="i" class="info-section__value">{{ value + (i !== values.length - 1 ? ', ' : '') }}</span>
    </div>
  </div>
</template>
  <script setup lang='ts'>
  import { useSlots, computed } from 'vue';
  import Icon from '../icons/Icon.vue';
  interface Props { label: string; values: string[]; valuesDirection?: 'column' | 'row'; icon?: any }
  const props = withDefaults(defineProps<Props>(), { valuesDirection: 'column' })
  const hasIconSlot = useSlots().icon !== undefined
  const isComponentIcon = computed(() => props.icon && typeof props.icon === 'object')
  const isSidebarIcon = computed(() => typeof props.icon === 'string' && props.icon.startsWith('sidebar/'))
  </script>
// ...existing code...
<style scoped>
.info-section{display:flex;flex-direction:column;gap:4px;background:#f6f7f8;padding:6px 8px;border-radius:10px}
.info-section__header{display:flex;justify-content:space-between;align-items:center}
.info-section__title{display:flex;align-items:center;gap:6px}
.info-section__icon-wrapper{width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center}
.info-section__icon-image{max-width:100%;max-height:100%;object-fit:contain}
.info-section__label{font-size:14px;color:#6b7280}
.info-section__values{display:flex;gap:2px;flex-direction:column}
.info-section__value{font-size:14px;line-height:1.25}
</style>
