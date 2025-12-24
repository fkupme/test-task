<template>
	<div>
		<!-- Для мобильных устройств (< 640px) отображаем в BottomSheet -->
		<template v-if="isMobileDevice">
			<!-- Слот для активатора в мобильной версии -->
			<slot name="activator" />

			<!-- Bottom Sheet для мобильных устройств -->
			<v-bottom-sheet v-model="internalValue" scrollable>
				<v-card class="bottom-sheet-wrapper">
					<div ref="handle" class="bottom-sheet-wrapper__handle">
						<div class="bottom-sheet-wrapper__handle-bar" />
					</div>
					<div class="bottom-sheet-wrapper__content">
						<div v-if="normalizedErrorText" class="bottom-sheet-wrapper__error">
							{{ normalizedErrorText }}
						</div>
						<slot name="content" />
					</div>
				</v-card>
			</v-bottom-sheet>
		</template>

		<!-- Для десктопа (≥ 640px) отображаем обычное содержимое -->
		<template v-else>
			<div v-if="normalizedErrorText" class="bottom-sheet-wrapper__error bottom-sheet-wrapper__error--desktop">
				{{ normalizedErrorText }}
			</div>
			<slot name="desktop-content">
				<!-- Если нет слота desktop-content, используем общий контент -->
				<slot name="content" />
			</slot>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

interface Props {
	modelValue?: boolean;
	errorText?: string | string[] | null;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: false,
	errorText: null,
});

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

// Внутреннее состояние отображения bottom sheet
const internalValue = computed({
	get: () => props.modelValue,
	set: value => emit('update:modelValue', value),
});

const normalizedErrorText = computed(() => {
	if (!props.errorText) return '';
	return Array.isArray(props.errorText) ? props.errorText.filter(Boolean).join('\n') : String(props.errorText);
});

// Упрощаем определение мобильного режима - только по ширине экрана
const directMobileCheck = ref(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
const isMobileDevice = computed(() => directMobileCheck.value);

// Ссылка на хэндлер для перетаскивания
const handle = ref<HTMLElement | null>(null);
let startY = 0;
let startHeight = 0;

// Обрабатываем изменение размера окна
const updateViewport = () => {
	directMobileCheck.value = window.innerWidth < 640;

	// Если размер изменился на десктоп, закрываем bottom sheet
	if (!isMobileDevice.value && internalValue.value) {
		internalValue.value = false;
	}
};

// Добавляем слушатели событий при монтировании компонента
onMounted(() => {
	// Обновляем проверку мобильного устройства при монтировании
	updateViewport();

	// Добавляем слушатель изменения размера окна
	window.addEventListener('resize', updateViewport);

	// Настраиваем события для перетаскивания в мобильной версии
	if (handle.value) {
		handle.value.addEventListener('mousedown', startDrag);
		handle.value.addEventListener('touchstart', startDrag, { passive: false });
	}
});

// Удаляем слушатели событий при размонтировании компонента
onBeforeUnmount(() => {
	window.removeEventListener('resize', updateViewport);

	if (handle.value) {
		handle.value.removeEventListener('mousedown', startDrag);
		handle.value.removeEventListener('touchstart', startDrag);
	}

	document.removeEventListener('mousemove', drag);
	document.removeEventListener('touchmove', drag);
	document.removeEventListener('mouseup', stopDrag);
	document.removeEventListener('touchend', stopDrag);
});

// Закрываем bottom sheet при изменении размера окна с мобильного на десктоп
watch(isMobileDevice, (newValue, oldValue) => {
	if (!newValue && oldValue && internalValue.value) {
		internalValue.value = false;
	}
});

// Функции для перетаскивания bottom sheet
function startDrag(e: MouseEvent | TouchEvent) {
	e.preventDefault();

	const bottomSheet = handle.value?.closest(
		'.v-bottom-sheet__content'
	) as HTMLElement;
	if (!bottomSheet) return;

	if (e instanceof MouseEvent) {
		startY = e.clientY;
	} else {
		startY = e.touches[0].clientY;
	}

	startHeight = bottomSheet.offsetHeight;

	document.addEventListener('mousemove', drag);
	document.addEventListener('touchmove', drag, { passive: false });
	document.addEventListener('mouseup', stopDrag);
	document.addEventListener('touchend', stopDrag);
}

function drag(e: MouseEvent | TouchEvent) {
	e.preventDefault();

	const bottomSheet = handle.value?.closest(
		'.v-bottom-sheet__content'
	) as HTMLElement;
	if (!bottomSheet) return;

	let currentY;
	if (e instanceof MouseEvent) {
		currentY = e.clientY;
	} else {
		currentY = e.touches[0].clientY;
	}

	const deltaY = currentY - startY;
	const newHeight = startHeight - deltaY;

	// Установка минимальной и максимальной высоты
	const maxHeight = window.innerHeight * 0.9;
	const minHeight = 200;

	if (newHeight > minHeight && newHeight < maxHeight) {
		bottomSheet.style.height = `${newHeight}px`;

		// Если перетащили слишком низко, закрываем bottom sheet
		if (deltaY > startHeight / 2) {
			internalValue.value = false;
			stopDrag();
		}
	}
}

function stopDrag() {
	document.removeEventListener('mousemove', drag);
	document.removeEventListener('touchmove', drag);
	document.removeEventListener('mouseup', stopDrag);
	document.removeEventListener('touchend', stopDrag);
}
</script>

<script lang="ts">
export default {
	name: 'BottomSheetWrapper',
};
</script>

<style lang="scss" scoped>
.bottom-sheet-wrapper {
	position: relative;
	border-top-left-radius: 16px;
	border-top-right-radius: 16px;
	overflow: hidden;
	padding: 0;

	&__handle {
		display: flex;
		justify-content: center;
		padding: 12px 0;
		cursor: grab;
		touch-action: none;
		user-select: none;

		&:active {
			cursor: grabbing;
		}
	}

	&__handle-bar {
		width: 40px;
		height: 4px;
		background-color: #e0e0e0;
		border-radius: 4px;
	}

	&__content {
		padding: 0 16px 16px;
		overflow-y: auto;
		max-height: calc(90vh - 40px);
	}

	&__error {
		white-space: pre-line;
		font-size: 12px;
		line-height: 1.3;
		margin: 0 0 10px;
		color: rgb(var(--v-theme-error));
	}

	&__error--desktop {
		padding: 0 0 10px;
	}
}
</style>
