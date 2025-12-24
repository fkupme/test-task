<template>
  <div class="ui-card">
    <slot></slot>
  </div>
</template>

<script setup>
// No props needed for this basic version
</script>

<style lang="scss" scoped>
.ui-card {
  background-color: #ffffff;
  border-radius: 12px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
</style>
