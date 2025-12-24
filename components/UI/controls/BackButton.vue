<template>
  <div v-if="shouldShow" class="back-container">
    <button class="back-btn" type="button" @click="goBack()">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <span class="label"><slot>{{ label }}</slot></span>
  </div>
</template>

<script setup lang="ts">
import { useSafeBack } from "@/composables/useSafeBack";
const { goBack } = useSafeBack();

const route = useRoute();
const props = defineProps<{ text?: string }>();
const label = computed(() => props.text || (route.meta?.backLabel as string) || (route.meta?.title as string) || "Назад");

// Скрываем кнопку на главной странице
const shouldShow = computed(() => route.path !== '/')
</script>

<style scoped>
.back-container {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  padding: 8px;
  cursor: pointer;
  color: #121212;
  border-radius: 8px;
}
.back-btn:hover { 
  background: rgba(0, 0, 0, 0.05);
}
.icon { 
  width: 32px; 
  height: 32px;
  display: block;
}
.label { 
  font-size: 18px; 
  font-weight: 600; 
  letter-spacing: 0.2px;
  color: #121212;
  user-select: none;
}
</style> 