<template>
  <span class="avatar-bage">
    <img :src="src" alt="avatar-bage" />
    <span class="bage" v-if="bage">{{ bage }}</span>
  </span>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
  src: {
    type: String,
    required: true
  },
  bage: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.avatar-bage {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f5f5;
}
.avatar-bage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bage {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #4caf50;
  color: #fff;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 10px;
}
</style>
