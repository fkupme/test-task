<template>
	<div class="select-field">
		<v-select
			:model-value="modelValue"
			:label="label"
			:placeholder="placeholder"
			:items="items"
			:item-title="itemTitle"
			:item-value="itemValue"
			:variant="variant"
			:density="density"
			:class="classes"
			:hide-details="hideDetails"
			:autocomplete="autocomplete"
			:multiple="multiple"
			:chips="chips"
			:clearable="clearable"
			:menu-props="mergedMenuProps"
			:append-inner-icon="null"
			@update:model-value="updateValue"
		>
			<!-- Пользовательский slot для selection → в приоритете -->
			<template v-if="$slots.selection" #selection="slotProps">
				<slot name="selection" v-bind="slotProps" />
			</template>
			<!-- Встроенная компактная подпись выбранных значений (только для multiple) -->
			<template v-else-if="useSelectionSummary" #selection="{ index }">
				<span v-if="index === 0">{{ selectionSummary }}</span>
			</template>
			<template v-if="$slots.item" #item="slotProps">
				<slot name="item" v-bind="slotProps" />
			</template>
			<!-- Встроенный рендер айтемов с чекбоксами и опциональной иконкой -->
			<template v-else-if="withCheckboxes" #item="{ item, props: itemProps }">
				<v-list-item v-bind="itemProps" :title="''">
					<template #prepend>
						<v-checkbox
							:model-value="isSelected(item.value)"
							:ripple="false"
							hide-details
							density="compact"
						/>
						<UIInfoIcon
							v-if="showInfoIcon && getIconTypeForItem(item)"
							:icon-type="getIconTypeForItem(item)"
							:size="18"
							class="ml-3 mr-2"
							mode="icon-only"
						/>
					</template>
					<v-list-item-title>{{ item.title }}</v-list-item-title>
				</v-list-item>
			</template>
			<template #append-inner>
				<slot name="append-inner" />
			</template>
		</v-select>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
	modelValue?: string | number | object | any[] | null;
	label?: string;
	placeholder?: string;
	items?: any[];
	itemTitle?: string;
	itemValue?: string;
	/** Встроенный рендер чекбоксов в пунктах списка (для multiple) */
	withCheckboxes?: boolean;
	/** Показать иконку-индикатор в айтеме (рядом с чекбоксом) */
	showInfoIcon?: boolean;
	/** Тип иконки для UIInfoIcon для всех элементов (если не задан per-item) */
	infoIconType?:
		| 'mobile'
		| 'catalog'
		| 'widget'
		| 'external_calendar'
		| 'telegram'
		| 'comment'
		| 'inactive_comment'
		| 'equip'
		| 'limitations'
		| 'abonement'
		| 'exit'
		| 'trash'
		| 'paymentOnline'
		| 'weblk'
		| 'star'
		| 'bookmark'
		| 'appevent'
		| 'yclients'
		| 'gcalendar'
		| 'camera_add'
		| 'document';
	/** Имя поля в item.raw с типом иконки (per-item) */
	itemIconTypeKey?: string;
	/** Функция, которая возвращает тип иконки для элемента (перекрывает itemIconTypeKey) */
	getItemIconType?: (item: any) => string | null | undefined;
	/** Как отображать подпись выбранных значений в multiple (при отключенных chips)
	 * none – фиксированная строка selectionLabelMany
	 * first – заголовок первого выбранного
	 * count – количество выбранных
	 */
	multipleSelectionLabelMode?: 'none' | 'first' | 'count';
	/** Текст для состояния «ничего не выбрано/Все» */
	selectionLabelAll?: string;
	/** Текст для состояния «выбрано несколько» (используется при mode = 'none') */
	selectionLabelMany?: string;
	variant?:
		| 'outlined'
		| 'plain'
		| 'solo'
		| 'filled'
		| 'underlined'
		| 'solo-inverted'
		| 'solo-filled';
	density?: 'default' | 'comfortable' | 'compact';
	class?: string;
	hideDetails?: boolean;
	autocomplete?: string;
	multiple?: boolean;
	chips?: boolean;
	clearable?: boolean;
	menuProps?: object;
	/** Включить обработку пункта "Все" (выделяет/снимает все) для multiple+withCheckboxes */
	enableSelectAll?: boolean;
	/** Значение пункта "Все" */
	selectAllValue?: any;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	label: '',
	placeholder: '',
	items: () => [],
	itemTitle: 'title',
	itemValue: 'value',
	withCheckboxes: false,
	showInfoIcon: false,
	infoIconType: 'catalog',
	itemIconTypeKey: 'iconType',
	multipleSelectionLabelMode: 'first',
	selectionLabelAll: 'Все',
	selectionLabelMany: 'Несколько',
	variant: 'solo',
	density: 'comfortable',
	class: '',
	hideDetails: true,
	autocomplete: 'off',
	multiple: false,
	chips: false,
	menuProps: () => ({}),
	enableSelectAll: true,
	selectAllValue: null,
});

const emit = defineEmits<{
	(e: 'update:modelValue', value: any): void;
}>();

const classes = computed(() => {
	return `input-hover-focus ui-select-field ${props.class}`;
});

// Сливаем menuProps с нашим дефолтным contentClass для выпадашки
const mergedMenuProps = computed(() => {
	const mp: Record<string, any> = props.menuProps || {};
	const existing = mp.contentClass || mp['content-class'];
	const contentClass = ['ui-select-menu', existing].filter(Boolean).join(' ');
	return { ...mp, contentClass };
});

// Значения для сравнения/обработки select-all
const previousArray = ref<any[]>([]);
watch(
	() => props.modelValue,
	v => {
		previousArray.value = Array.isArray(v) ? [...(v as any[])] : [];
	},
	{ immediate: true }
);

const allSelectableValues = computed<any[]>(() => {
	return (props.items || [])
		.map((it: any) => (it && typeof it === 'object' ? it[props.itemValue] : it))
		.filter((v: any) => v !== props.selectAllValue);
});

const updateValue = (value: any) => {
	// Перехватываем поведение для select-all
	if (
		isMultiple.value &&
		props.withCheckboxes &&
		props.enableSelectAll &&
		Array.isArray(value)
	) {
		const prev = previousArray.value;
		const next = value as any[];
		const hadAll = prev.includes(props.selectAllValue);
		const hasAll = next.includes(props.selectAllValue);

		if (hasAll) {
			// Пользователь кликнул по пункту "Все"
			const isAllAlreadySelected =
				prev.length === allSelectableValues.value.length;
			if (isAllAlreadySelected) {
				// Было выбрано всё → очистить выбор
				emit('update:modelValue', []);
				previousArray.value = [];
				return;
			} else if (!hadAll) {
				// Выделить всё
				const newValue = [...allSelectableValues.value];
				emit('update:modelValue', newValue);
				previousArray.value = newValue;
				return;
			}
		}
		// Если вручную выделили все пункты — оставляем как есть
	}
	emit('update:modelValue', value);
};

// Вычисления для встроенных selection/item
const isMultiple = computed(() => !!props.multiple);
const useSelectionSummary = computed(() => isMultiple.value && !props.chips);

const selectedArray = computed<any[]>(() =>
	Array.isArray(props.modelValue) ? (props.modelValue as any[]) : []
);

const itemsArray = computed<any[]>(() => props.items || []);

function isSelected(val: any) {
	return selectedArray.value.some(v => v === val);
}

function findTitleByValue(val: any): string | undefined {
	const item = itemsArray.value.find((it: any) => {
		if (it && typeof it === 'object') return it[props.itemValue] === val;
		return it === val;
	});
	if (!item) return undefined;
	if (item && typeof item === 'object') return item[props.itemTitle];
	return String(item);
}

const selectionSummary = computed(() => {
	const arr = selectedArray.value;
	// Пусто
	if (arr.length === 0) return props.selectionLabelAll;
	// Все выбраны
	if (arr.length === allSelectableValues.value.length)
		return props.selectionLabelAll;
	if (arr.length === 1)
		return findTitleByValue(arr[0]) ?? props.selectionLabelAll;
	// Несколько
	switch (props.multipleSelectionLabelMode) {
		case 'first':
			return findTitleByValue(arr[0]) ?? props.selectionLabelMany;
		case 'count':
			return String(arr.length);
		default:
			return props.selectionLabelMany;
	}
});

// Определение типа иконки для конкретного пункта списка
function getIconTypeForItem(slotItem: any): string | undefined {
	// Vuetify передает item с полем raw
	const raw = slotItem?.raw ?? slotItem;
	// Если задана функция — используем её
	if (props.getItemIconType) {
		const v = props.getItemIconType(raw);
		return v ?? undefined;
	}
	// Иначе пробуем взять по ключу из raw
	const key = props.itemIconTypeKey;
	if (raw && key && raw[key])
		return raw[key] === 'unknown' ? undefined : raw[key];
	// Без per-item иконки — не показываем
	return undefined;
}
</script>

<style lang="scss" scoped>
.select-field {
	width: 100%;

	:deep(.v-field) {
		box-shadow: none;
		background: #f5f4f4;
		border-radius: 10px;
	}

	:deep(.v-field--variant-solo) {
		box-shadow: none;
	}

	:deep(.v-field--variant-plain .v-field__outline) {
		display: none;
	}

	:deep(.v-select) {
		.v-list-item--active {
			background-color: rgba(0, 0, 0, 0.05);
		}
	}

	&.input-hover-focus {
		:deep(.v-field) {
			transition: all 0.2s ease;

			&:hover {
				background: #eeeeee;
			}
		}

		:deep(.v-field--focused) {
			background: #e8e8e8 !important;
		}
	}
}
</style>

<style lang="scss">
/* Глобальные стили для выпадашек UISelectField через contentClass */
.ui-select-menu {
	border-radius: 10px;
}
.ui-select-menu .v-card {
	border-radius: 10px;
	box-shadow: 2px 4px 50px 0px #0000001a;
}
/* Внутренние отступы у списка в меню: вертикаль 8, горизонталь 12 */
.ui-select-menu .v-list {
	padding: 8px 12px;
}
/* Айтемы: паддинг 8 и радиус 10 */
.ui-select-menu .v-list-item {
	border-radius: 10px;
	padding: 8px;
}
</style>
