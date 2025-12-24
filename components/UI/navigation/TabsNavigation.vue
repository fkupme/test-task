<template>
  <div class="tabs-section">
    <div class="tabs">
      <button 
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab', { active: activeTab === tab.key }]" 
        @click="$emit('update:activeTab', tab.key as T)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends string">
import type { TabItem } from '@/composables/useTabs'

interface Props {
  tabs: TabItem[]
  activeTab: T
}

defineProps<Props>()

defineEmits<{
  'update:activeTab': [tab: T]
}>()
</script>

<style scoped lang="scss">
.tabs-section {
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 8px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 8px;
  width: fit-content;
}

.tab {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s ease;
}

.tab.active {
  background: #fff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab:hover:not(.active) {
  color: #333;
}
</style>