<template>
	<!--
		Адаптивная обёртка для BaseFilter:
		- mobile: VBottomSheet с activator + content
		- desktop: рендерим только desktop-content (внутри обычно VMenu со своим activator)
	-->
	<div>
		<template v-if="isMobile">
			<v-bottom-sheet v-model="model">
				<template v-if="$slots.activator" #activator>
					<slot name="activator" />
				</template>
				<slot name="content" />
			</v-bottom-sheet>
		</template>

		<template v-else>
			<slot name="desktop-content" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDisplay } from 'vuetify';

interface Props {
	modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

const model = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit('update:modelValue', value),
});

const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);
</script>
