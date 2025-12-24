<template>
  <div class="ui-select" :class="{ 'is-open': isOpen, disabled }">
    <div class="select-trigger" @click="toggleDropdown">
      <span class="select-value">{{ selectedLabel || placeholder }}</span>
      <svg class="select-arrow" :class="{ 'is-rotated': isOpen }" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="#666" stroke-width="1.5"/>
      </svg>
    </div>
    <div v-if="isOpen" class="select-dropdown">
      <div 
        v-for="option in options" 
        :key="option.value"
        class="select-option"
        :class="{ 'is-selected': option.value === modelValue }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SelectOption { value: string | number; label: string }

const props = defineProps<{ modelValue?: string | number; options: SelectOption[]; placeholder?: string; disabled?: boolean }>()
const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)

const selectedLabel = computed(() => props.options.find(o => o.value === props.modelValue)?.label || '')

function toggleDropdown(){ if (!props.disabled) isOpen.value = !isOpen.value }
function selectOption(option: SelectOption){ emit('update:modelValue', option.value); isOpen.value = false }
function close(){ isOpen.value = false }
function handleClickOutside(e: Event){
  const target = e.target as HTMLElement
  if (!target.closest('.ui-select')) close()
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped lang="scss">
.ui-select { position:relative; width:100%; }
.select-trigger { width:100%; padding:12px; background:#f8f9fa; border:1px solid #e0e0e0; border-radius:8px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; font-size:14px; font-weight:500; color:#000; transition:.2s; }
.select-trigger:hover { border-color:#d0d0d0; }
.is-open .select-trigger { border-color:#3b82f6; border-bottom-left-radius:8px; border-bottom-right-radius:8px; }
.select-value { flex:1; text-align:left; }
.select-arrow { transition:transform .2s; }
.select-arrow.is-rotated { transform:rotate(180deg); }
.select-dropdown { position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #e0e0e0; border-top:none; border-radius:0 0 8px 8px; box-shadow:0 4px 12px rgba(0,0,0,.1); max-height:200px; overflow-y:auto; z-index:9000; }
.select-option { padding:12px; font-size:14px; color:#333; cursor:pointer; transition:background-color .2s; }
.select-option:hover { background:#f8f9fa; }
.select-option.is-selected { background:#e3f2fd; color:#1976d2; font-weight:500; }
.ui-select.disabled .select-trigger { background:#f5f5f5; color:#999; cursor:not-allowed; }
</style>
