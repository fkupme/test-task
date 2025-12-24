<template>
  <div class="overlay" v-if="show">
    <div class="confirm-modal">
      <p class="confirm-text"><slot>Вы уверены?</slot></p>
      <div class="confirm-actions">
        <button class="btn-secondary" @click="$emit('cancel')" :disabled="loading">Отмена</button>
        <button class="btn-primary" @click="$emit('confirm')" :disabled="loading">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
interface Props { show: boolean; loading?: boolean; confirmText?: string }
withDefaults(defineProps<Props>(), { show: false, loading: false, confirmText: 'ОК' });
</script>
<style scoped lang="scss">
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.confirm-modal { background: #fff; border-radius: 28px; padding: 40px 48px 36px; width: 420px; max-width: calc(100% - 32px); box-shadow: 0 8px 32px -4px rgba(0,0,0,.12),0 4px 12px -2px rgba(0,0,0,.08); }
.confirm-text { font-size: 20px; font-weight: 600; text-align: center; margin: 0 0 32px; }
.confirm-actions { display: flex; gap: 16px; justify-content: center; }
.btn-secondary, .btn-primary { flex: 1; height: 56px; font-size: 18px; font-weight: 500; border-radius: 20px; border: none; cursor: pointer; }
.btn-secondary { background: #f1f1f1; }
.btn-secondary:hover { background: #e5e5e5; }
.btn-primary { background: #1d1d1f; color: #fff; }
.btn-primary:hover { background: #000; }
.btn-primary:disabled, .btn-secondary:disabled { opacity: .5; cursor: default; }
</style>
