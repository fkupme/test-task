<template>
  <span class="avatar">
    <img :src="src" alt="avatar" />
  </span>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  src: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f5f5;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
