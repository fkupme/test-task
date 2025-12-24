<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    temporary
    :scrim="false"
    :width="420"
    class="drawer"
    :style="{ zIndex: 2000 }"
    disable-resize-watcher
  >
    <div class="drawer-wrapper bgc-primary">
      <div class="drawer-content bgc-secondary">
        <v-toolbar flat class="px-4 drawer-header">
          <div class="title-section">
            <v-toolbar-title>{{ title }}</v-toolbar-title>
            <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
          </div>
          <template #append>
            <slot name="toolbar-append" />
            <v-btn
              variant="text"
              icon="mdi-close"
              color="grey"
              @click="$emit('close-drawer')"
            />
          </template>
        </v-toolbar>

        <div class="drawer-body">
          <slot />
        </div>

        <div class="drawer-footer">
          <slot name="switch" />
          <slot name="price" />
          <div class="drawer-actions">
              <UIButton
              v-if="showLeftButton"
              :color="leftButtonColor"
              :variant="leftButtonVariant"
              :disabled="leftButtonDisabled"
              class="action-button action-button-left"
              @click="$emit('left-click')"
            >
              {{ leftButtonText }}
              </UIButton>
            <v-spacer v-if="showLeftButton && showRightButton"/>
              <UIButton
              v-if="showRightButton"
              :color="rightButtonColor"
              :variant="rightButtonVariant"
              :disabled="rightButtonDisabled"
              class="action-button action-button-right"
              @click="$emit('right-click')"
            >
              {{ rightButtonText }}
              </UIButton>
          </div>
        </div>
      </div>
    </div>
  </v-navigation-drawer>
  <div
    v-if="isOpen"
    class="custom-scrim"
    @click="isOpen = false; $emit('close-drawer')"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Drawer' },
  subtitle: { type: String, default: '' },
  width: { type: [String, Number], default: 420 },
  leftButtonText: { type: String, default: 'Отмена' },
  leftButtonColor: { type: String, default: 'grey' },
  leftButtonVariant: { type: String, default: 'text' },
  showLeftButton: { type: Boolean, default: true },
  leftButtonDisabled: { type: Boolean, default: false },
  rightButtonText: { type: String, default: 'Сохранить' },
  rightButtonColor: { type: String, default: 'primary' },
  rightButtonVariant: { type: String, default: 'elevated' },
  showRightButton: { type: Boolean, default: true },
  rightButtonDisabled: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:modelValue',
  'left-click',
  'right-click',
  'close-drawer'
])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})
</script>

<style scoped>
.drawer { width: 420px; border-radius: 10px; position: relative; z-index: 1102; }
.drawer-wrapper { display: flex; flex-direction: column; box-sizing: border-box; }
.drawer-content { height: calc(100dvh - 60px); display: flex; flex-direction: column; }
.drawer-header { position: sticky; top: 0; z-index: 100; background-color: white; border-bottom: 1px solid #e0e0e0; }
.title-section { display: flex; flex-direction: column; align-items: flex-start; }
.subtitle { font-size: 12px; color: #666; margin-top: 4px; font-weight: normal; }
.drawer-body { flex: 1; padding-top: 20px; overflow-y: auto; }
.drawer-footer { position: sticky; bottom: 0; z-index: 100; background-color: white; margin-top: auto; }
.drawer-actions { display: flex; width: 100%; padding: 10px 10px 20px 10px; gap: 10px; }
.action-button { min-width: unset; width: calc(50% - 10px); padding: 10px; border-radius: 10px; font-size: 16px; height: 48px; }
.action-button-left { flex-grow: 1; background-color: #f5f4f4; color: #252529; }
.action-button-right { 
  flex-grow: 1; 
  background-color: #111827 !important; 
  color: #fff !important; 
}
.action-button-right:hover {
  background-color: #0a0a0a !important;
}
::v-deep .v-navigation-drawer__scrim {
  height: 100dvh !important;
  min-height: 100dvh !important;
  top: 0 !important;
}

.custom-scrim {
  position: fixed;
  inset: 0;
  height: 100dvh;
  min-height: 100dvh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1500;
}
</style> 