<template>
  <div class="ui-kit">
    <div class="ui-kit__header">
      <h1>UI Kit</h1>
      <p>Демонстрация всех UI компонентов</p>
    </div>

    <div class="ui-kit__nav">
      <button
        v-for="section in sections"
        :key="section.id"
        :class="['nav-btn', { active: activeSection === section.id }]"
        @click="activeSection = section.id"
      >
        {{ section.title }}
      </button>
    </div>

    <div class="ui-kit__content">
      <!-- Buttons & Controls -->
      <section v-show="activeSection === 'controls'" class="section">
        <h2 class="section__title">Кнопки и контролы</h2>

        <div class="demo-block">
          <h3>Buttons</h3>
          <div class="demo-row">
            <UIButton>Default Button</UIButton>
            <UIButton color="primary">Primary Button</UIButton>
            <UIButton color="error">Error Button</UIButton>
            <UIButton color="success">Success Button</UIButton>
            <UIButton disabled>Disabled Button</UIButton>
          </div>
          <div class="demo-row">
            <UIButton variant="secondary">Secondary</UIButton>
            <UIButton variant="text">Text Button</UIButton>
            <UIButton size="small">Small</UIButton>
            <UIButton size="large">Large</UIButton>
          </div>
        </div>

        <div class="demo-block">
          <h3>Toggle Button</h3>
          <div class="demo-row">
            <UIToggleButton v-model="toggleValue" />
            <UIToggleButton v-model="toggleValue2" label="С лейблом" />
            <UIToggleButton :model-value="true" disabled label="Disabled" />
          </div>
        </div>

        <div class="demo-block">
          <h3>Back Button</h3>
          <UIBackButton />
        </div>

        <div class="demo-block">
          <h3>Select</h3>
          <div class="demo-row">
            <UISelect
              v-model="selectValue"
              :options="selectOptions"
              placeholder="Выберите опцию"
              style="width: 300px"
            />
          </div>
        </div>
      </section>

      <!-- Fields -->
      <section v-show="activeSection === 'fields'" class="section">
        <h2 class="section__title">Поля ввода</h2>

        <div class="demo-block">
          <h3>Text Fields</h3>
          <div class="demo-column">
            <UITextField v-model="textValue" label="Обычное поле" />
            <UITextField v-model="textValue2" label="С placeholder" placeholder="Введите текст..." />
            <UITextField v-model="textValue3" label="Обязательное поле" required />
            <UITextField label="Disabled поле" disabled model-value="Disabled value" />
            <UITextField label="С ошибкой" error-messages="Поле заполнено неверно" />
          </div>
        </div>

        <div class="demo-block">
          <h3>Select Field</h3>
          <div class="demo-column">
            <UISelectField
              v-model="selectFieldValue"
              :items="selectOptions"
              label="Выберите значение"
            />
            <UISelectField
              :items="selectOptions"
              label="Required Select"
              required
            />
          </div>
        </div>
      </section>

      <!-- Display -->
      <section v-show="activeSection === 'display'" class="section">
        <h2 class="section__title">Отображение данных</h2>

        <div class="demo-block">
          <h3>Info Section</h3>
          <UIInfoSection 
            label="Информация" 
            :values="['Значение 1', 'Значение 2', 'Значение 3']"
          />
        </div>

        <div class="demo-block">
          <h3>Badges</h3>
          <div class="demo-row">
            <UIBadge>Default Badge</UIBadge>
            <UIBadge color="primary">Primary</UIBadge>
            <UIBadge color="success">Success</UIBadge>
            <UIBadge color="error">Error</UIBadge>
            <UIBadge color="warning">Warning</UIBadge>
          </div>
        </div>
      </section>

      <!-- Icons -->
      <section v-show="activeSection === 'icons'" class="section">
        <h2 class="section__title">Иконки</h2>

        <div class="demo-block">
          <h3>Icons</h3>
          <div class="demo-row">
            <UIIcon icon="toolbar/settings" size="sm" />
            <UIIcon icon="toolbar/settings" size="md" />
            <UIIcon icon="toolbar/settings" size="lg" />
            <UIIcon icon="toolbar/settings" size="xl" />
          </div>
        </div>

        <div class="demo-block">
          <h3>Rotating Icon</h3>
          <UIRotatingIcon icon="toolbar/settings" :rotating="isRotating" />
          <UIButton @click="isRotating = !isRotating">
            {{ isRotating ? 'Stop' : 'Start' }} Rotation
          </UIButton>
        </div>
      </section>

      <!-- Pickers -->
      <section v-show="activeSection === 'pickers'" class="section">
        <h2 class="section__title">Пикеры</h2>

        <div class="demo-block">
          <h3>Date Picker</h3>
          <UIDatePicker 
            :month="currentMonth" 
            :year="currentYear"
            :special-days="specialDays"
            :non-working-days="nonWorkingDays"
            @day-click="handleDateClick"
          />
          <p v-if="selectedDate" style="margin-top: 12px; color: #374151;">
            Выбрана дата: {{ selectedDate }}
          </p>
        </div>

        <div class="demo-block">
          <h3>Country Flag Dropdown</h3>
          <UICountryFlagDropdown 
            v-model="countryValue" 
            :countries="countries"
          />
          <p v-if="countryValue" style="margin-top: 12px; color: #374151;">
            Выбрана страна: {{ countryValue.name }} ({{ countryValue.code }})
          </p>
        </div>
      </section>

      <!-- Cards -->
      <section v-show="activeSection === 'cards'" class="section">
        <h2 class="section__title">Карточки</h2>

        <div class="demo-block">
          <h3>Card</h3>
          <UICard style="max-width: 400px;">
            <template #title>Заголовок карточки</template>
            <p>Содержимое карточки. Здесь может быть любой контент.</p>
            <p style="margin-top: 8px; color: #6B7280;">Дополнительная информация...</p>
          </UICard>
        </div>
      </section>

      <!-- Modals & Drawers -->
      <section v-show="activeSection === 'modals'" class="section">
        <h2 class="section__title">Модалы и Drawer'ы</h2>

        <div class="demo-block">
          <h3>Confirm Dialog</h3>
          <UIButton @click="dialogVisible = true">Открыть диалог</UIButton>
          <UIConfirmDialog
            :show="dialogVisible"
            confirm-text="Подтвердить"
            @confirm="handleConfirm"
            @cancel="dialogVisible = false"
          >
            Вы уверены, что хотите выполнить это действие?
          </UIConfirmDialog>
          <p v-if="dialogResult" style="margin-top: 12px; color: #374151;">
            Результат: {{ dialogResult }}
          </p>
        </div>

        <div class="demo-block">
          <h3>Simple Drawer</h3>
          <p style="margin: 0 0 12px; color: #6B7280;">
            `UISimpleDrawer` — адаптивный drawer: на desktop это `v-navigation-drawer`,
            на mobile — `v-bottom-sheet`. Поддерживает `showBack`, slot'ы `header-extra/footer`,
            метод `showNotification()` (через `ref`) и проп `errorText` (автоматически показывает ошибку).
          </p>

          <div class="demo-row" style="margin-bottom: 12px;">
            <UIButton @click="drawerBasicVisible = true">Открыть (базовый)</UIButton>
            <UIButton @click="drawerDisabledVisible = true">Открыть (disabled)</UIButton>
            <UIButton @click="drawerErrorVisible = true">Открыть (с ошибкой)</UIButton>
          </div>

          <div style="margin-top: 8px;">
            <p style="margin: 0 0 8px; color: #374151; font-weight: 600;">Пример использования</p>
            <pre style="margin: 0; padding: 12px; background: #F9FAFB; border-radius: 8px; overflow: auto;">
<code>&lt;UISimpleDrawer v-model=&quot;open&quot; title=&quot;Создание&quot; :show-back=&quot;true&quot; @back=&quot;onBack&quot;&gt;
  &lt;template #footer&gt;...кнопки...&lt;/template&gt;
  ...контент...
&lt;/UISimpleDrawer&gt;</code>
            </pre>
          </div>

          <!-- Basic -->
          <UISimpleDrawer
            ref="drawerBasicRef"
            v-model="drawerBasicVisible"
            title="Базовый drawer"
            @back="drawerLastAction = 'back (basic)'"
          >
            <div style="padding: 0 16px 16px;">
              <UITextField v-model="drawerForm.name" label="Название" placeholder="Введите название" />
              <div style="height: 12px;" />
              <UITextField v-model="drawerForm.key" label="Ключ" placeholder="Введите ключ" />
            </div>

			<template #footer>
				<div class="demo-row" style="justify-content: flex-end;">
					<UIButton variant="text" @click="drawerBasicVisible = false">Закрыть</UIButton>
					<UIButton
						color="primary"
						@click="drawerBasicRef?.showNotification('Сохранено', 'success')"
					>Сохранить</UIButton>
				</div>
			</template>
          </UISimpleDrawer>

          <!-- Disabled / loading imitation -->
          <UISimpleDrawer
            v-model="drawerDisabledVisible"
            title="Drawer без действий"
          >
            <div style="padding: 0 16px 16px; color: #6B7280;">
              Пример drawer'а без footer — только контент.
            </div>
          </UISimpleDrawer>

          <!-- Error example -->
          <UISimpleDrawer
            v-model="drawerErrorVisible"
            title="Drawer с ошибкой"
            :error-text="drawerErrorMessages.name"
          >
            <div style="padding: 0 16px 16px;">
              <UITextField
                v-model="drawerErrorForm.name"
                label="Название"
                placeholder="Введите название"
                :error-messages="drawerErrorMessages.name"
              />
              <div style="height: 12px;" />
              <UITextField
                v-model="drawerErrorForm.key"
                label="Ключ"
                placeholder="Введите ключ"
                :error-messages="drawerErrorMessages.key"
              />
              
            </div>

			<template #footer>
				<div class="demo-row" style="justify-content: flex-end;">
					<UIButton variant="text" @click="drawerErrorVisible = false">Закрыть</UIButton>
					<UIButton color="error" @click="drawerLastAction = 'save blocked (error)'">
						Сохранить
					</UIButton>
				</div>
			</template>
          </UISimpleDrawer>

          <p v-if="drawerLastAction" style="margin-top: 12px; color: #374151;">
            Последнее событие drawer: {{ drawerLastAction }}
          </p>
        </div>
      </section>

      <!-- Filters -->
      <section v-show="activeSection === 'filters'" class="section">
        <h2 class="section__title">Фильтры</h2>

        <div class="demo-block">
          <h3>Base Filter</h3>
          <UIBaseFilter title="Фильтр">
            <template #content>
              <div style="padding: 16px;">
                <p style="margin-bottom: 12px;">Содержимое фильтра</p>
                <UIButton @click="() => {}">Применить</UIButton>
              </div>
            </template>
          </UIBaseFilter>
        </div>

        <div class="demo-block">
          <h3>Tab Filter</h3>
          <UITabFilter
            v-model="tabFilterValue"
            :tabs="filterTabs"
          />
          <p style="margin-top: 12px; color: #374151;">
            Активная вкладка: {{ tabFilterValue }}
          </p>
        </div>
      </section>

      <!-- Layout -->
      <section v-show="activeSection === 'layout'" class="section">
        <h2 class="section__title">Layout компоненты</h2>

        <div class="demo-block">
          <h3>Tabs Navigation</h3>
          <UITabsNavigation
            :tabs="navigationTabs"
            :active-tab="tabValue"
            @update:active-tab="tabValue = $event"
          />
          <div style="margin-top: 16px; padding: 16px; background: #F9FAFB; border-radius: 8px;">
            <p>Активная вкладка: {{ tabValue }}</p>
          </div>
        </div>
      </section>

      <!-- Notifications -->
      <section v-show="activeSection === 'notifications'" class="section">
        <h2 class="section__title">Уведомления</h2>

        <div class="demo-block">
          <h3>Notification Examples</h3>
          <div class="demo-column">
            <UIButton @click="showNotification('success')">Success Notification</UIButton>
            <UIButton @click="showNotification('error')">Error Notification</UIButton>
            <UIButton @click="showNotification('info')">Info Notification</UIButton>
            <UIButton @click="showNotification('warning')">Warning Notification</UIButton>
          </div>
        </div>
      </section>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationStore } from '@/stores/notification';
import { countries } from '@/constants/countries';
import type { Country } from '@/constants/countries';

definePageMeta({
  title: 'UI Kit',
  middleware: 'auth'
});

const notificationStore = useNotificationStore();

const activeSection = ref('controls');

const sections = [
  { id: 'controls', title: 'Controls' },
  { id: 'fields', title: 'Fields' },
  { id: 'display', title: 'Display' },
  { id: 'icons', title: 'Icons' },
  { id: 'pickers', title: 'Pickers' },
  { id: 'cards', title: 'Cards' },
  { id: 'modals', title: 'Modals & Drawers' },
  { id: 'filters', title: 'Filters' },
  { id: 'layout', title: 'Layout' },
  { id: 'notifications', title: 'Notifications' },
];

// Controls
const toggleValue = ref(false);
const toggleValue2 = ref(true);
const selectValue = ref('');
const selectOptions = [
  { label: 'Опция 1', value: 'option1' },
  { label: 'Опция 2', value: 'option2' },
  { label: 'Опция 3', value: 'option3' },
];

// Fields
const textValue = ref('');
const textValue2 = ref('');
const textValue3 = ref('');
const selectFieldValue = ref('');

// Icons
const isRotating = ref(false);

// Pickers - DatePicker
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const selectedDate = ref('');
const specialDays = ref([
  {
    Id: '1',
    Description: 'Праздник',
    Day: 1,
    Date: `${currentYear.value}-01-01`,
    IsArchived: false
  }
]);
const nonWorkingDays = ref<string[]>([]);

const handleDateClick = (date: Date) => {
  selectedDate.value = date.toLocaleDateString('ru-RU');
};

// Pickers - CountryFlagDropdown
const countryValue = ref<Country | null>(null);

// Modals & Drawers
const dialogVisible = ref(false);
const dialogResult = ref('');
const drawerBasicVisible = ref(false);
const drawerDisabledVisible = ref(false);
const drawerErrorVisible = ref(false);
const drawerLastAction = ref('');

type SimpleDrawerExposed = {
  showNotification: (message: string, type?: 'error' | 'success' | 'warning' | 'info', duration?: number) => void;
};

const drawerBasicRef = ref<SimpleDrawerExposed | null>(null);

const drawerForm = ref({ name: '', key: '' });
const drawerErrorForm = ref({ name: '', key: '' });
const drawerErrorMessages = ref({
  name: ['Обязательное поле'],
  key: ['Обязательное поле'],
});

const handleConfirm = () => {
  dialogResult.value = 'Подтверждено!';
  dialogVisible.value = false;
};

// Filters
const tabFilterValue = ref('all');
const filterTabs = [
  { key: 'all', label: 'Все', count: 10 },
  { key: 'active', label: 'Активные', count: 5 },
  { key: 'inactive', label: 'Неактивные', count: 3 },
];

// Layout
const tabValue = ref('tab1');
const navigationTabs = [
  { key: 'tab1', label: 'Вкладка 1' },
  { key: 'tab2', label: 'Вкладка 2' },
  { key: 'tab3', label: 'Вкладка 3' },
];

// Notifications
const showNotification = (type: 'success' | 'error' | 'info' | 'warning') => {
  const messages = {
    success: 'Операция выполнена успешно!',
    error: 'Произошла ошибка при выполнении операции',
    info: 'Информационное сообщение',
    warning: 'Предупреждение о важном событии'
  };

  notificationStore.showNotification({
    message: messages[type],
    color: type,
    timeout: 3000
  });
};
</script>

<style scoped>
.ui-kit {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.ui-kit__header {
  margin-bottom: 32px;
}

.ui-kit__header h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #111827;
}

.ui-kit__header p {
  font-size: 16px;
  color: #6B7280;
  margin: 0;
}

.ui-kit__nav {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-btn {
  padding: 8px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

.nav-btn.active {
  background: #111827;
  color: white;
  border-color: #111827;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section__title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #111827;
}

.demo-block {
  margin-bottom: 32px;
}

.demo-block:last-child {
  margin-bottom: 0;
}

.demo-block h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #374151;
}

.demo-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.demo-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
}
</style>
