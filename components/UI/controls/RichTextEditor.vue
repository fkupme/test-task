<template>
  <div class="rte">
    <div class="rte__toolbar">
      <button type="button" class="rte__btn" @click="exec('bold')" title="Жирный"><b>B</b></button>
      <button type="button" class="rte__btn" @click="exec('italic')" title="Курсив"><i>I</i></button>
      <button type="button" class="rte__btn" @click="exec('underline')" title="Подчёркнутый"><u>U</u></button>
      <button type="button" class="rte__btn" @click="exec('strikeThrough')" title="Зачёркнутый">S</button>
      <button type="button" class="rte__btn" @click="exec('insertUnorderedList')" title="Список">• List</button>
      <button type="button" class="rte__btn" @click="exec('insertOrderedList')" title="Нумерованный список">1. List</button>
      <button type="button" class="rte__btn" @click="exec('formatBlock','H2')" title="Заголовок H2">H2</button>
      <button type="button" class="rte__btn" @click="exec('formatBlock','P')" title="Параграф">P</button>
      <button type="button" class="rte__btn" @click="insertLink" title="Ссылка">🔗</button>
    </div>
    <div
      ref="editable"
      class="rte__editor"
      contenteditable="true"
      :placeholder="placeholder"
      @input="onInput"
      @blur="onBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Введите текст...'
});

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void; (e: 'blur'): void }>();

const editable = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (editable.value) {
    editable.value.innerHTML = props.modelValue || '';
  }
});

watch(() => props.modelValue, (val) => {
  if (editable.value && editable.value.innerHTML !== (val || '')) {
    editable.value.innerHTML = val || '';
  }
});

function onInput() {
  if (!editable.value) return;
  emit('update:modelValue', editable.value.innerHTML);
}

function onBlur() {
  emit('blur');
}

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
  onInput();
}

function insertLink() {
  const url = prompt('Введите URL');
  if (url) exec('createLink', url);
}
</script>

<style scoped>
.rte {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rte__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.rte__btn {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
}
.rte__editor {
  min-height: 360px;
  background: #f5f5f5;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 16px;
  outline: none;
}
.rte__editor:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
}
</style>
