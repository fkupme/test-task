<template>
  <div ref="rootEl" class="tabs-container">
    <!-- Навигация по вкладкам (Vuetify slide-group) -->
    <div ref="navEl" class="tabs-navigation" :style="navStyle" @wheel.prevent="onWheel">
      <v-slide-group
        class="tabs-slide-group" :show-arrows="false" :model-value="activeTabIndex"
        @update:model-value="val => setActiveTab(val as number)">
        <v-slide-group-item v-for="(tab, index) in tabs" :key="tab.key" :value="index">
          <div
            class="tab-button-wrapper"
            :class="{ 'tab-wrapper--active': activeTabIndex === index, 'tab-wrapper--disabled': tab.disabled }">
            <v-btn
              variant="plain" :ripple="false" class="tab-button vuetify-btn"
              :class="{ 'tab-button--active': activeTabIndex === index, 'tab-button--disabled': tab.disabled }"
              :disabled="tab.disabled" density="compact" @click="setActiveTab(index)">
              <span class="tab-button__title">{{ tab.title }}</span>
              <v-tooltip
                v-if="hasTabsTooltip && errorsFor(tab.key).length" location="bottom" origin="auto"
                :open-delay="120">
                <template #activator="{ props: tProps }">
                  <v-icon
                    v-bind="tProps" icon="mdi-alert-circle-outline" size="16" class="tab-button__alert"
                    @click.stop />
                </template>
                <div class="tab-errors-tooltip">
                  <div v-for="err in errorsFor(tab.key)" :key="err" class="tab-errors-tooltip__item">{{ err }}</div>
                </div>
              </v-tooltip>
              <template v-if="canDeleteTabs">
                <v-menu v-if="closeMenu" location="bottom" origin="auto" :close-on-content-click="true">
                  <template #activator="{ props: mAct }">
                    <v-icon v-bind="mAct" icon="mdi-close" size="14" class="tab-button__close" @click.stop />
                  </template>
                  <v-list density="compact" class="tab-close-menu">
                    <v-list-item class="tab-close-menu__item" @click.stop="emit('archive', tab.key)">
                      <v-list-item-title>Архивировать</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      class="tab-close-menu__item tab-close-menu__delete"
                      @click.stop="emit('delete', tab.key)">
                      <v-list-item-title>Удалить</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <v-icon v-else icon="mdi-close" size="14" class="tab-button__close" @click.stop="onCloseTab(tab)" />
              </template>
            </v-btn>
          </div>
        </v-slide-group-item>
      </v-slide-group>
      <v-btn
        v-if="showAddButton" size="small" class="tab-button tab-button--add add-btn" variant="plain"
        :ripple="false" :class="{ 'add-btn--anim': addAnimating }" aria-label="Добавить" @click="onAddAnimated">+
      </v-btn>
    </div>

    <!-- Контент активной вкладки -->
    <div class="tabs-content">
      <div v-if="tabs[activeTabIndex]" :key="tabs[activeTabIndex].key" class="tab-content">
        <component
          :is="tabs[activeTabIndex].component" v-bind="tabs[activeTabIndex].props || {}"
          @tab-data-changed="handleTabDataChanged" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { usePricesActionsStore } from '@/stores/pricesActions';
interface TabItem {
  key: string;
  title: string;
  component: any; // Vue компонент
  props?: Record<string, any>; // Пропсы для компонента
  disabled?: boolean; // Отключен ли таб
}

interface Props {
  tabs: TabItem[];
  defaultTab?: number;
  showAddButton?: boolean;
  canDeleteTabs?: boolean;
  hasTabsTooltip?: boolean;
  closeMenu?: boolean;
  sideSelector?: string; // селектор правой панели
  sideGap?: number; // отступ между панелью и табами
}

const props = withDefaults(defineProps<Props>(), {
  defaultTab: 0,
  showAddButton: false,
  canDeleteTabs: false,
  hasTabsTooltip: false,
  closeMenu: false,
  sideSelector: '.price-settings-side',
  sideGap: 42,
});
const emit = defineEmits<{
  tabChanged: [tabIndex: number, tab: TabItem];
  tabDataChanged: [tabKey: string, data: any];
  add: [];
  close: [tabKey: string];
  archive: [tabKey: string];
  delete: [tabKey: string];

}>();
// errors provider (optional external store hook injected via global window OR fallback noop)
function errorsFor(_key: string): string[] { 
  // Return empty array if store doesn't exist
  return [];
}

function onCloseTab(tab: TabItem) {
  // Разрешаем закрытие даже при ошибках (раньше блокировалось наличием валидационных ошибок)
  emit('close', tab.key);
}

const activeTabIndex = ref(props.defaultTab);
const rootEl = ref<HTMLElement | null>(null);
const navEl = ref<HTMLElement | null>(null);
const navWidth = ref<number | null>(null);

function recalcNavWidth() {
  const root = rootEl.value; if (!root) return;
  const nav = navEl.value; if (!nav) return;
  const side = document.querySelector(props.sideSelector) as HTMLElement | null;
  const rootRect = root.getBoundingClientRect();
  let max = rootRect.width;
  if (side) {
    const sideRect = side.getBoundingClientRect();
    // если правая панель визуально перекрывает часть root
    if (sideRect.left < rootRect.right) {
      const available = sideRect.left - rootRect.left - (props.sideGap || 0);
      if (available > 60) max = available; // защитный минимум
    }
  }
  navWidth.value = Math.max(60, Math.floor(max));
}

onMounted(() => {
  recalcNavWidth();
  const ro = new ResizeObserver(() => recalcNavWidth());
  if (rootEl.value) ro.observe(rootEl.value);
  const side = document.querySelector(props.sideSelector) as HTMLElement | null;
  if (side) ro.observe(side);
  window.addEventListener('resize', recalcNavWidth);
});

const navStyle = computed(() => navWidth.value ? { maxWidth: navWidth.value + 'px' } : {});

function onWheel(e: WheelEvent) {
  const cont = navEl.value?.querySelector('.v-slide-group__container');
  if (!cont) return;
  const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX; // trackpad horizontal or vertical
  (cont as HTMLElement).scrollLeft += delta;
}

const setActiveTab = (index: number) => {
  // Не переключаем на отключенные табы
  if (!props.tabs[index] || props.tabs[index]?.disabled) return;
  if (!props.tabs[index] || props.tabs[index]?.disabled) return;
  activeTabIndex.value = index;
  emit("tabChanged", index, props.tabs[index]);
};

const handleTabDataChanged = (data: unknown) => {
  const currentTab = props.tabs[activeTabIndex.value];
  emit("tabDataChanged", currentTab.key, data);
};

const addAnimating = ref(false);
function onAddAnimated() {
  if (addAnimating.value) return; // не дублируем визуально
  addAnimating.value = true;
  setTimeout(() => { addAnimating.value = false; }, 120);
  emit('add');
}


// Следим за изменением пропса defaultTab
watch(
  () => props.defaultTab,
  (newValue) => {
    const clamped = Math.min(Math.max(newValue, 0), props.tabs.length ? props.tabs.length - 1 : 0);
    activeTabIndex.value = clamped;
  },
  { immediate: true },
);

// Следим за изменениями списка вкладок (удаление / добавление) и корректируем индекс
watch(
  () => props.tabs.length,
  () => {
    if (activeTabIndex.value >= props.tabs.length) {
      activeTabIndex.value = props.tabs.length ? props.tabs.length - 1 : 0;
    }
  }
);

// Следим за изменениями списка вкладок (удаление / добавление) и корректируем индекс
watch(
  () => props.tabs.length,
  () => {
    if (activeTabIndex.value >= props.tabs.length) {
      activeTabIndex.value = props.tabs.length ? props.tabs.length - 1 : 0;
    }
  }
);
</script>

<style scoped lang="scss">
// @use "@/assets/styles/_mixins.scss" as *;
/* убрали жёсткий 600px лимит */

.tabs-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

.tabs-navigation {
  display: flex;
  background: transparent;
  gap: 0.25rem;

  .add-btn--anim {
    animation: add-btn-pulse 120ms ease-in-out;
  }

  @keyframes add-btn-pulse {
    0% {
      transform: scale(1);
      background: rgba(99, 128, 255, 0.10);
    }

    55% {
      transform: scale(0.85);
      background: rgba(99, 128, 255, 0.18);
    }

    100% {
      transform: scale(1);
      background: rgba(99, 128, 255, 0.0);
    }
  }
}

:deep(.tabs-navigation) {
  box-sizing: border-box;
}

:deep(.v-slide-group__container) {
  max-width: 100%;
}

:deep(.v-slide-group__content) {
  max-width: 100%;
}

.tabs-slide-group .v-slide-group__content {
  gap: 4px;
}

.tabs-slide-group .v-btn {
  text-transform: none;
  letter-spacing: normal;
}

.tabs-slide-group :deep(.v-slide-group__prev),
.tabs-slide-group :deep(.v-slide-group__next) {
  display: none !important;
}

/* блокируем авто-translate контейнера, чтобы не отпрыгивало к активному */
:deep(.v-slide-group__content) {
  transform: none !important;
}

.add-btn {
  flex: 0 0 auto;

  :deep(.v-btn.v-btn--density-default) {
    height: auto;
  }
}

.tab-button-wrapper {
  position: relative;
  display: flex;
}

.tab-button__title {
  padding-right: 4px;
}

.tab-button__close {
  margin-left: 4px;
  opacity: 0;
  transition: opacity .15s;
  cursor: pointer;
}

.tab-button--active .tab-button__close {
  opacity: 1;
}

.tab-button-wrapper:hover .tab-button__close {
  opacity: 1;
}

.tab-button__alert {
  margin-left: 4px;
  color: #ef4444;
}

.tab-errors-tooltip {
  max-width: 240px;
  font-size: 11px;
  line-height: 1.3;
}

.tab-errors-tooltip__item {
  padding: 2px 0;
}

.tab-close-menu {
  min-width: 140px;
}

.tab-close-menu__item {
  font-size: 12px;
}

.tab-close-menu__delete {
  color: #dc2626;
}

.tab-actions-menu {
  display: flex;
  flex-direction: column;
  padding: 6px 8px;
  gap: 4px;
  background: #fff;
  box-shadow: 2px 4px 50px 0px #0000001A;
  border-radius: 6px;
}

.tab-actions-menu__item {
  transition: .3s ease-in;
  background: #fff;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.tab-actions-menu__item:hover {
  background: #F5F4F4;
  transition: .3s ease-in
}

.tab-button {
  background: transparent;
  border: none;
  padding: 7px 12px 5px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  min-height: 32px;
  color: #fff;
  background: #ccc;
  cursor: pointer;
  border-radius: 20px 8px 0 0;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: fit-content;
  overflow: hidden;

  @media (max-width: 1024px) {
    font-size: 0.75rem;
  }

  &:hover:not(&--disabled) {
    background: #e9ecef;
    color: #495057;
  }

  &--active {
    background: #ffffff;
    color: #212529;
    border-radius: 20px 8px 0 0;

    &:hover {
      background: #ffffff;
      color: #212529;
    }
  }

  &--disabled {
    background: transparent;
    border: 2px dashed #c4c4c4;
    color: #c4c4c4;
    cursor: not-allowed;

    &:hover {
      background: transparent;
      color: #c4c4c4;
    }
  }

  &--add {
    font-weight: 600;
    background: #91919B4D;
    color: #fff;
    border-radius: 8px 8px 0 0;
    width: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #cbd5e1;
    }

    &.tab-button--active {
      background: #e2e8f0;
      color: #374151;
    }
  }
}

.tabs-content {
  padding: 24px;
  min-height: 200px;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 0 0 12px 12px;
  // @include custom-scrollbars;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.tab-content {
  animation: fadeIn 0.2s ease-in-out;
  height: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
