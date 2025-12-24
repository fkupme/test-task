
<template>
  <div class="home">
    <h1>Главная страница</h1>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Главная',
  middleware: 'auth'
})
</script>

<style scoped>

</style>
