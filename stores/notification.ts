import { defineStore } from "pinia";

interface Notification {
  message: string;
  color?: string;
  timeout?: number;
  visible: boolean;
}

interface NotificationState {
  notification: Notification;
}

export const useNotificationStore = defineStore("notification", {
  state: (): NotificationState => ({
    notification: {
      message: "",
      color: "info",
      timeout: 5000,
      visible: false,
    },
  }),

  actions: {
    /**
     * Показать уведомление
     */
    showNotification(payload: Omit<Notification, "visible">) {
      this.notification = {
        message: payload.message,
        color: payload.color || "info",
        timeout: payload.timeout || 5000,
        visible: true,
      };
    },

    /**
     * Показать уведомление об успехе
     */
    showSuccess(message: string, timeout?: number) {
      this.showNotification({
        message,
        color: "success",
        timeout,
      });
    },

    /**
     * Показать уведомление об ошибке
     */
    showError(message: string, timeout?: number) {
      this.showNotification({
        message,
        color: "error",
        timeout,
      });
    },

    /**
     * Показать информационное уведомление
     */
    showInfo(message: string, timeout?: number) {
      this.showNotification({
        message,
        color: "info",
        timeout,
      });
    },

    /**
     * Показать предупреждающее уведомление
     */
    showWarning(message: string, timeout?: number) {
      this.showNotification({
        message,
        color: "warning",
        timeout,
      });
    },

    /**
     * Скрыть уведомление
     */
    hideNotification() {
      this.notification.visible = false;
    },
  },
});
