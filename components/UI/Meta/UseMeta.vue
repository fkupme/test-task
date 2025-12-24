<template>
  <div v-if="false"/>
</template>

<script setup lang="ts">
const props = defineProps<{
	meta: {
		title: string
		description: string
		image?: string
	}
}>()
useHead({
	title: props.meta.title,
	meta: [
		{ name: 'description', content: props.meta.description },
		{ property: 'og:image', content: props.meta.image },
	],
})
</script>

<style>

</style>