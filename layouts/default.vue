<script setup lang="ts"></script>

<template>
  <div class="layout-wrapper">
    <div class="content-container">
      <v-container fluid class="pa-0">
        <NuxtPage />
      </v-container>
    </div>
    <UINotificationSnackbar />
  </div>
</template>

<style lang="scss" scoped>
.layout-wrapper {
  width: 100%;
  min-height: 100vh;
  position: relative;
  background-color: #F6F7F8;
}

.content-container {
  background-color: #F6F7F8 !important;
  height: fit-content;
  padding: 20px;

  @media (max-width: 640px) {
    padding: 12px;
  }
}
</style>
