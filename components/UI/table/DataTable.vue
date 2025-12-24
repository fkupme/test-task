<template>
	<v-data-table
		:headers="headers"
		:items="items"
		:item-key="itemKey"
		:loading="loading"
		:items-per-page="itemsPerPage"
		:items-per-page-options="itemsPerPageOptions"
		:show-current-page="showCurrentPage"
		:row-props="getRowProps"
		hover
	>
		<!-- Header info/top slot -->
		<!-- <template #top>
			<slot v-if="$slots.top" name="top" />
			<div v-else-if="showHeaderInfo" class="data-table__header-info">
				Записей: {{ items.length }}
			</div>
		</template> -->

		<!-- Кастомные ячейки через слоты -->
		<template v-for="col in visibleColumns" :key="col.id" #[`item.${col.key}`]="{ item, index }">
			<slot
				:name="`cell.${col.key}`"
				:item="item"
				:column="col"
				:index="index"
			>
				{{ formatCell(item, col) }}
			</slot>
		</template>

		<template #loading>
			<slot name="loading">
				<v-progress-linear indeterminate />
			</slot>
		</template>

		<template #no-data>
			<slot name="empty">
				<div class="data-table__empty">Нет данных</div>
			</slot>
		</template>
	</v-data-table>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'UIDataTable' });

export interface Column {
	id: string;
	key: string;
	title: string;
	visible: boolean;
	width?: string | number;
	align?: 'start' | 'center' | 'end';
	sortable?: boolean;
	format?: (item: any) => string;
}

interface Props {
	items: any[];
	columns: Column[];
	loading?: boolean;
	itemKey: string;
	height?: string;
	rowHeight?: number;
	clickableRows?: boolean;
	showHeaderInfo?: boolean;
	itemsPerPage?: number;
	itemsPerPageOptions?: number[];
	showCurrentPage?: boolean;
	rowClass?: (item: any) => string | string[] | undefined;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
	height: '72dvh',
	rowHeight: 48,
	clickableRows: false,
	showHeaderInfo: false,
	itemsPerPage: 25,
	itemsPerPageOptions: () => [10, 25, 50, 100],
	showCurrentPage: true,
	rowClass: undefined,
});

const emit = defineEmits<{
	(e: 'row-click', item: any): void;
	(e: 'cell-click', item: any, column: Column): void;
}>();

const visibleColumns = computed(() => props.columns.filter(c => c.visible));
const headers = computed(() =>
	visibleColumns.value.map(c => ({
		title: c.title,
		key: c.key,
		sortable: c.sortable ?? true,
		width: c.width,
		align: c.align ?? 'start',
	}))
);

function clickRow(item: any) {
	if (props.clickableRows) emit('row-click', item);
}

function formatCell(item: any, column: Column): string {
	if (column.format) return column.format(item);
	const value = (item as any)?.[column.key];
	return value == null ? '—' : String(value);
}

// Функция для формирования пропсов строки (Vuetify 3 row-props)
const getRowProps = computed(() => {
	return (data: { item: any; index: number }) => {
		const { item } = data;
		let className: string | string[] = '';
		
		if (props.rowClass) {
			const customClass = props.rowClass(item);
			className = customClass || '';
		} else {
			className = item.IsArchived ? 'disabled' : '';
		}
		
		return {
			class: className,
			onClick: () => clickRow(item)
		};
	};
});
</script>

<style scoped>
.data-table__header-info {
	padding: 12px 16px;
	background: #f8f9fa;
	font-weight: 600;
	color: #252529;
	border-bottom: 1px solid #eee;
}
.data-table__empty {
	padding: 16px;
	color: #6b7280;
}

/* Стилизация заголовков столбцов */
:deep(.v-table__wrapper thead tr) {
	background-color: #f8f9fa !important;
}
:deep(.v-table__wrapper thead tr th) {
	background-color: #f8f9fa !important;
	border-bottom: 1px solid #e9ecef !important;
	white-space: nowrap !important;
}

/* Стилизация для архивированных/отключенных строк */
:deep(.v-data-table__wrapper tbody tr.disabled) {
	opacity: 0.6;
	background-color: #f9fafb !important;
}
:deep(.v-data-table__wrapper tbody tr.disabled:hover) {
	background-color: #f3f4f6 !important;
}
:deep(.v-data-table__wrapper tbody tr.disabled td) {
	color: #9ca3af !important;
}
</style>
