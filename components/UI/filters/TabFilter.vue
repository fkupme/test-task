<template>
  <v-chip-group
    :model-value="getSelectedIndex()"
    mandatory
    class="tab-filter"
    @update:model-value="(index) => $emit('update:modelValue', tabs[index].key)"
  >
    <v-chip
      v-for="(tab, index) in tabs"
      :key="tab.key"
      :value="index"
      variant="flat"
      class="tab-filter__chip"
      rounded="lg"
    >
      {{ tab.label }}
      <v-badge
        v-if="tab.count !== undefined"
        :content="tab.count"
        inline
        class="ml-1"
        color="transparent"
      />
    </v-chip>
  </v-chip-group>
</template>

<script setup lang="ts">
interface Tab {
	key: string;
	label: string;
	count?: number;
}

interface Props {
	modelValue: string;
	tabs: Tab[];
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);

const getSelectedIndex = () => {
	return props.tabs.findIndex((tab) => tab.key === props.modelValue);
};

const handleChipChange = (index: number) => {
	if (index !== null && index !== undefined && props.tabs[index]) {
		emit("update:modelValue", props.tabs[index].key);
	}
};
</script>

<style lang="scss" scoped>
.tab-filter {
	&__chip {
		background-color: transparent;
		color: #939292;
		&--selected {
			color: #000;
			background-color: #EAEAEA !important;
		}
	}

	:deep(.v-chip--selected) {
		background-color: #EAEAEA !important;

		.v-badge {
			color: white !important;
		}
	}
}
</style> 