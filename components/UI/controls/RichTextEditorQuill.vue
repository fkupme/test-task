<template>
  <div class="rteq">
    <QuillEditor
      v-model:content="content"
      :contentType="'html'"
      :placeholder="placeholder"
      :toolbar="toolbar"
      :theme="theme"
      class="rteq__editor"
    />
  </div>
</template>

<script setup lang="ts">
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

interface Props {
  modelValue?: string;
  placeholder?: string;
  theme?: 'snow' | 'bubble';
  toolbar?: any;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Наберите текст...',
  theme: 'snow',
  toolbar: () => [
    ['bold', 'italic', 'underline', 'strike'],
    [{ header: [1, 2, 3, false] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image', 'code-block'],
    ['clean']
  ]
});

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();

const content = computed({
  get: () => props.modelValue || '',
  set: (val: string) => emit('update:modelValue', val)
});

const { placeholder, toolbar, theme } = toRefs(props)
</script>

<style scoped>
.rteq__editor {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  min-height: 420px;
}
.rteq :deep(.ql-container) {
  min-height: 360px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}
.rteq :deep(.ql-toolbar) {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
</style>
