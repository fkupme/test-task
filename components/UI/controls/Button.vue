<template>
  <v-btn
    :class="[
      'custom-button',
      `custom-button--${variant}`,
      { 'custom-button--block': block },
      { 'custom-button--is-disabled': disabled },
    ]"
    :type="type"
    :loading="loading"
    :disabled="disabled"
    flat
    @click="$emit('click', $event)"
  >
    <slot />
  </v-btn>
</template>

<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "text";
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  backgroundColor?: string;
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  type: "button",
  loading: false,
  disabled: false,
  block: false,
});

interface Emits {
  (e: "click", event: MouseEvent): void;
}

defineEmits<Emits>();
</script>

<style lang="scss" scoped>
.v-btn {
  height: unset !important;
}

.custom-button {
  font-family: "Inter", sans-serif;
  font-weight: 500;
  font-size: 16px;
  border-radius: 8px;
  text-transform: none;
  padding-block: 17px;

  &--primary {
    &:disabled {
      background-color: #f5f5f5 !important;
      color: #e9e9e9 !important;
      opacity: 1 !important;

      /* Дополнительные селекторы для перекрытия Vuetify */
      /* Самые агрессивные селекторы */
      :deep(.v-btn__content) {
        color: #726e6e !important;
      }

      :deep(.v-btn__overlay) {
        background-color: #f5f5f5 !important;
      }
    }

    &:not(:disabled) {
      background-color: #252529 !important;
      color: #ffffff !important;
    }
  }

  &--secondary {
    background-color: #f5f4f4 !important;
    color: #000000 !important;
  }

  &--text {
    background-color: transparent !important;
    color: #000000 !important;
  }

  &--block {
    width: 100%;
  }
}
</style>
