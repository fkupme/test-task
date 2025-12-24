<template>
  <span class="info-icon">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#E0E0E0"/>
      <text x="10" y="15" text-anchor="middle" fill="#333" font-size="12" font-family="Arial" dy="-2">i</text>
    </svg>
  </span>
</template>

<script setup lang="ts">
// No props needed for static info icon
</script>

<style scoped>
.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}
</style>
