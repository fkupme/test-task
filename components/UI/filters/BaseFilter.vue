<template>
	<div
		class="base-filter"
		:class="{ 'base-filter--square': props.activatorVariant === 'square' }"
	>
		<!-- Используем адаптивную обёртку: mobile -> bottom sheet; desktop -> передаём v-menu через desktop-content -->
		<UIBottomSheetWrapper v-model="open">
			<!-- Активатор (общий для mobile/desktop) -->
			<template v-if="!noActivator" #activator>
				<slot name="activator">
					<UIToggleButton
						class="base-filter__activator"
						:icon="icon || 'filter'"
						size="md"
						:title="title || 'Меню'"
						:style="activatorStyleComputed"
						@click="toggleOpen()"
					/>
				</slot>
			</template>

			<!-- Desktop: прокидываем v-menu как desktop-content -->
			<template #desktop-content>
				<v-menu
					v-model="menuOpen"
					:location="menuLocation"
					:close-on-content-click="closeOnContentClick"
					:offset="0"
					:content-class="'base-filter__menu'"
				>
					<template #activator="{ props: menuActivator }">
						<span v-if="!noActivator" class="base-filter__activator-wrap">
							<slot name="activator">
								<UIToggleButton
									class="base-filter__activator"
									:icon="icon || 'filter'"
									size="md"
									:title="title || 'Меню'"
									:style="activatorStyleComputed"
									v-bind="menuActivator"
								/>
							</slot>
						</span>
					</template>
					<div class="base-filter__content" :style="menuStyle">
						<slot name="desktop-content">
							<slot name="content" />
						</slot>
					</div>
				</v-menu>
			</template>

			<!-- Mobile: контент рендерится прямо в bottom sheet -->
			<template #content>
				<div class="base-filter__sheet">
					<slot name="content">
						<slot name="desktop-content" />
					</slot>
				</div>
			</template>
		</UIBottomSheetWrapper>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
	modelValue?: boolean;
	icon?: string;
	title?: string;
	noActivator?: boolean;
	contentWidth?: number | string;
	minContentWidth?: number | string;
	closeOnContentClick?: boolean;
	location?: string;
	activatorVariant?: 'default' | 'square';
	activatorStyle?: any;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: false,
	icon: undefined,
	title: undefined,
	noActivator: false,
	contentWidth: 'auto',
	minContentWidth: 280,
	closeOnContentClick: false,
	location: 'bottom start',
	activatorVariant: 'default',
	activatorStyle: undefined,
});

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

// Единое состояние открытия (синхронизируем с v-menu на десктопе и с BottomSheetWrapper)
const open = computed({
	get: () => props.modelValue,
	set: (val: boolean) => emit('update:modelValue', val),
});

// Отдельная переменная для v-menu на десктопе; синхронизируем с open
const menuOpen = ref<boolean>(open.value);
watch(
	() => open.value,
	v => {
		menuOpen.value = v;
	}
);
watch(menuOpen, v => {
	if (v !== open.value) open.value = v;
});

const menuStyle = computed(() => {
	const style: Record<string, string> = {};
	// width
	if (props.contentWidth && props.contentWidth !== 'auto') {
		style.width =
			typeof props.contentWidth === 'number'
				? `${props.contentWidth}px`
				: String(props.contentWidth);
	}
	// min-width always applied to avoid ultra-narrow menus
	if (props.minContentWidth) {
		style.minWidth =
			typeof props.minContentWidth === 'number'
				? `${props.minContentWidth}px`
				: String(props.minContentWidth);
	}
	return style;
});

function toggleOpen() {
	open.value = !open.value;
}

// Приводим тип для Vuetify Anchor, чтобы не ругался тайпчекер
const menuLocation = computed(() => props.location as any);

// Стиль активатора: через пропсы, чтобы гарантированно "долетало"
const activatorStyleComputed = computed(() => {
	const square: Record<string, string> = {
		width: '44px',
		height: '44px',
		borderRadius: '10px',
		background: '#f5f4f4',
		color: '#6b7280',
		padding: '0',
		border: 'none',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
	};
	const base: Record<string, string> = {};
	const variant = props.activatorVariant;
	const variantStyle = variant === 'square' ? square : base;
	return { ...variantStyle, ...(props.activatorStyle || {}) } as any;
});
</script>

<style scoped lang="scss">
.base-filter__menu {
	border-radius: 12px;
	box-shadow: 2px 4px 50px 0px #0000001a;
	overflow: hidden;
}
.base-filter__content {
	background: #fff;
}
.base-filter__sheet {
	padding: 0;
}
.base-filter__activator-wrap {
	display: inline-flex;
}

/* Квадратная кнопка-активатор как в TzarFilter (только при variant='square') */
.base-filter--square .base-filter__activator :deep(.toggle-button) {
	width: 44px !important;
	height: 44px !important;
	border-radius: 10px !important;
	background: #f5f4f4 !important;
	color: #6b7280 !important;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0 !important;
	border: none !important;
}
.base-filter--square .base-filter__activator :deep(.toggle-icon) {
	width: 24px !important;
	height: 24px !important;
}
</style>
