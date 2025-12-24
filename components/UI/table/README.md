# UIDataTable + useTableColumns + useTableExport

Короткая справка по новым табличным примитивам и примеры использования.

## UIDataTable

Обёртка над Vuetify v-data-table-virtual с единым API и слотами.

- Имя компонента: `UIDataTable`
- Автоимпортируется из `components/UI/table/DataTable.vue`

Props:

- items: any[] — данные строк
- columns: Column[] — конфигурация колонок (видимые/скрытые)
- loading?: boolean — состояние загрузки
- itemKey: string — ключ строки
- height?: string = '72dvh'
- rowHeight?: number = 48
- clickableRows?: boolean = false
- showHeaderInfo?: boolean = false
- rowClass?: (item) => string | string[]

Слоты:

- top — информация над таблицей
- loading — состояние загрузки
- empty — когда нет данных
- row — полная кастомизация строки (приоритетнее ячеек)
- cell.{key} — рендер конкретной ячейки (если нет `row`)

Пример:

<UIDataTable
:items="orders"
:columns="visibleColumns"
item-key="id"
:loading="loading"

> <template #top>

    <div class="data-table__header-info">Записей: {{ orders.length }}</div>

  </template>

<template v-slot:[`cell.clientName`]="{ item }">
<button class="client-link">{{ item.clientName }}</button>
</template>

<template v-slot:[`cell.status`]="{ item }">
<span class="status-badge">{{ item.status }}</span>
</template>

<template #empty>
<div>Нет данных</div>
</template>
</UIDataTable>

## Column

interface Column<T = any> {
id: string;
key: string;
title: string;
visible: boolean;
width?: string | number;
align?: 'start' | 'center' | 'end';
sortable?: boolean;
format?: (item: T) => string; // используется экспортом
}

## useTableColumns

Компосабл для управления колонками, видимостью и DnD + localStorage.

const {
columns, // все колонки
visibleColumns, // только видимые
hiddenColumns, // только скрытые
toggleVisibility,
showAll,
hideAll,
resetColumns,
onDragStartVisible,
onDragStartHidden,
onDropVisible,
onDropHidden,
loadColumns,
saveColumns,
} = useTableColumns(DEFAULT_COLUMNS, {
storageKey: 'yourReport.columns.v1',
autoSave: true,
});

Вызвать `loadColumns()` в onMounted для инициализации.

## useTableExport

Компосабл для экспорта видимых колонок в CSV/XLSX.

const { exportCsv, exportXlsx } = useTableExport({
items: displayedRows,
columns: visibleColumns,
filename: 'report',
});

- CSV: добавляет BOM, ; как разделитель, кавычит со спецсимволами
- XLSX: динамический импорт xlsx, хедер в A1, имя файла с timestamp

## Быстрый шаблон

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useTableColumns } from '~/composables/useTableColumns'
import { useTableExport } from '~/composables/useTableExport'

type Row = { id: string; clientName: string; status: string }

const DEFAULT_COLUMNS = [
  { id: 'clientName', key: 'clientName', title: 'Клиент', visible: true },
  { id: 'status', key: 'status', title: 'Статус', visible: true },
]

const rows = ref<Row[]>([])
const { visibleColumns, loadColumns } = useTableColumns<Row>(DEFAULT_COLUMNS, { storageKey: 'demo.columns.v1' })
const displayedRows = computed(() => rows.value)
const { exportCsv, exportXlsx } = useTableExport<Row>({ items: displayedRows, columns: visibleColumns, filename: 'demo' })

onMounted(loadColumns)
</script>

<template>
  <div>
    <UIDataTable :items="displayedRows" :columns="visibleColumns" item-key="id" />
    <!-- Кнопки экспорта где нужно -->
    <button @click="exportCsv">CSV</button>
    <button @click="exportXlsx">XLSX</button>
  </div>
</template>
