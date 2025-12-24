<template>
  <span class="rotating-icon">
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="#333" stroke-width="2" fill="none" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#4caf50" stroke-width="2" fill="none" />
    </svg>
  </span>
</template>

<script setup lang="ts">
// No props needed for static rotating icon
</script>

<style scoped>
.rotating-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  animation: rotate 2s linear infinite;
}
@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
