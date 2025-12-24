<template>
  <v-snackbar
    v-model="notification.visible"
    :color="notification.color"
    :timeout="notification.timeout"
    @update:model-value="onUpdateVisible"
  >
    {{ notification.message }}
    <template #actions>
      <v-btn
        color="white"
        variant="text"
        icon="mdi-close"
        @click="closeNotification"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useNotificationStore } from "@/stores/notification";

const notificationStore = useNotificationStore();
const { notification } = storeToRefs(notificationStore);

/**
 * Закрыть уведомление
 */
const closeNotification = () => {
  notificationStore.hideNotification();
};

/**
 * Обработка изменения видимости
 */
const onUpdateVisible = (visible: boolean) => {
  if (!visible) {
    notificationStore.hideNotification();
  }
};
</script>
