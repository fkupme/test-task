<template>
  <button
    :class="['toggle-button', { 'toggle-button--active': isActive }]"
    :style="buttonStyle"
    :title="tooltip"
    v-bind="$attrs"
    :aria-pressed="isActive"
    @click="handleClick"
  >
    <span class="toggle-icon-container">
      <img
        v-if="iconUrl"
        :src="iconUrl"
        :alt="propsIcon"
        class="toggle-icon"
        :style="{ width: currentSize, height: currentSize }"
      >
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const sizes = {
  xs: '16px',
  sm: '20px',
  md: '24px',
  lg: '28px',
};

interface ToggleButtonProps {
  icon?: string;
  modelValue?: boolean;
  tooltip?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
}

const props = withDefaults(defineProps<ToggleButtonProps>(), {
  modelValue: false,
  tooltip: '',
  size: 'md',
  color: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'click', event: Event): void;
}>();

const propsIcon = computed(() => props.icon ?? '');
const iconUrl = computed(() => {
  const icon = propsIcon.value;
  if (!icon) return '';
  if (icon.startsWith('/assets/') || icon.startsWith('http')) return icon;
  return `/assets/icons/${icon}.svg`;
});

const isActive = computed(() => !!props.modelValue);
const currentSize = computed(() => sizes[props.size || 'md'] || sizes.md);
const buttonStyle = computed(() => (props.color ? { backgroundColor: props.color } : {}));

const handleClick = (event: Event) => {
  emit('update:modelValue', !props.modelValue);
  emit('click', event);
};
</script>

<style scoped>
.toggle-button {
  background: transparent;
  border: 2px solid #f5f5f5;
  cursor: pointer;
  border-radius: 50%;
  position: relative;
  transition: all 0.12s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  outline: none;
  box-sizing: border-box;
  padding: 6px;
  width: 40px;
  height: 40px;
  min-width: 40px;
}
.toggle-button:hover {
  background-color: rgba(0, 0, 0, 0.06);
}
.toggle-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  color: #cccccc;
}
.toggle-button--active {
  background-color: #252529;
  border-color: transparent;
}
.toggle-button--active .toggle-icon {
  filter: brightness(0) invert(1);
}
.toggle-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
}
.toggle-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>