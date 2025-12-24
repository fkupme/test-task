<template>
  <v-text-field
    v-bind="$attrs"
    v-model="inputValue"
    :label="label"
    :placeholder="placeholder"
    :type="type"
    :min="min"
    :max="max"
    :rules="rules"
    :hide-details="hideDetails"
    :disabled="disabled"
    :readonly="readonly"
    :density="density"
    :variant="variant"
    :color="color"
    :bg-color="bgColor"
    :append-inner-icon="appendInnerIcon"
    :append-icon="appendIcon"
    :prepend-inner-icon="prependInnerIcon"
    :prepend-icon="prependIcon"
    class="text-field"
    @keydown="handleKeydown"
    @click:append-inner="$emit('click:append-inner', $event)"
    @click:append="$emit('click:append', $event)"
    @click:prepend-inner="$emit('click:prepend-inner', $event)"
    @click:prepend="$emit('click:prepend', $event)"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
    @update:model-value="updateValue"
  >
    <slot />
    <template #append-inner>
      <slot name="append-inner" />
    </template>
		
  </v-text-field>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  type?: string;
  min?: number | string;
  max?: number | string;
  rules?: Array<(v: string) => boolean | string>;
  hideDetails?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  density?: "default" | "comfortable" | "compact";
  variant?: "filled" | "outlined" | "plain" | "underlined" | "solo";
  color?: string;
  bgColor?: string;
  appendInnerIcon?: string;
  appendIcon?: string;
  prependInnerIcon?: string;
  prependIcon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  label: "",
  placeholder: "",
  type: "text",
  min: undefined,
  max: undefined,
  rules: () => [],
  hideDetails: false,
  disabled: false,
  readonly: false,
  density: "default",
  variant: "solo",
  color: "primary",
  bgColor: "",
  appendInnerIcon: "",
  appendIcon: "",
  prependInnerIcon: "",
  prependIcon: "",
});

type ClickEvent =
  | "click:append-inner"
  | "click:append"
  | "click:prepend-inner"
  | "click:prepend";
type FocusEvent = "focus" | "blur";

interface Emits {
  (e: "update:modelValue", value: string): void;
  (e: FocusEvent, event: Event): void;
  (e: ClickEvent, event: MouseEvent): void;
}

const emit = defineEmits<Emits>();

const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit("update:modelValue", value),
});

function updateValue(value: string) {
  emit("update:modelValue", value);
}

function handleKeydown(event: KeyboardEvent) {
  // Блокируем нежелательные символы только для type="number"
  if (props.type === "number") {
    const invalidChars = ["e", "E", "+", "-", "."];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  }
}
</script>

<style lang="scss" scoped>
.text-field {
  font-family: "Inter", sans-serif;

  :deep(.v-field__input) {
    font-size: 14px;
    background-color: v-bind("bgColor || '#f5f5f5'");
    border-radius: 8px;
  }

  :deep(.v-field--variant-solo) {
    box-shadow: none;
  }

  :deep(.v-field) {
    border-radius: 8px;
    border: 1px solid #f5f5f5;
    transition: border 0.2s ease;

    &.v-field--focused {
      border: 1px solid #3f73c1;
      transition: border 0.2s ease;
    }

    &.v-field--error {
      border: 1px solid rgb(var(--v-theme-error));
      transition: border 0.2s ease;
    }
  }

  :deep(.v-field__outline) {
    display: none;
  }

  :deep(.v-label) {
    font-size: 14px;
    color: #757575;
  }

  :deep(.v-field--focused) {
    .v-field__outline {
      border-color: #8f2f2f !important;
    }
  }

  :deep(.v-field--variant-outlined .v-field__outline) {
    color: #f5f5f5;
  }

  :deep(.v-field) {
    background: #f5f4f4;
    border-radius: 10px;
  }

  :deep(.v-field__prepend-inner) {
    .v-icon {
      color: #9ca3af;
    }
  }
}
</style>
