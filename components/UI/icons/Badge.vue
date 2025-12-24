<template>
  <span class="badge" :class="type">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  type: {
    type: String,
    default: 'default'
  }
});
</script>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  background: #eee;
  color: #333;
}
.badge.default {
  background: #eee;
  color: #333;
}
.badge.success {
  background: #4caf50;
  color: #fff;
}
.badge.error {
  background: #f44336;
  color: #fff;
}
</style>
