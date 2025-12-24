<script setup lang="ts"></script>

<template>
  <div class="auth-layout">
    <v-container fluid class="fill-height pa-0">
      <v-row align="center" justify="center" class="ma-0">
        <v-col cols="12" sm="8" md="6" lg="4">
          
          <slot />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F6F7F8; /* slate-900 */
}

.toolbar { padding: 8px 0 12px 0; }
</style> 