<script setup lang="ts">
const props = withDefaults(defineProps<{
  src?: string
  alt?: string
}>(), {
  src: "",
  alt: "",
})

const open = ref(false)
const label = computed(() => props.alt ? `画像を拡大: ${props.alt}` : "画像を拡大")
</script>

<template>
  <UiDialog v-model:open="open">
    <button type="button" class="block max-w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :aria-label="label" @click="open = true">
      <img :src="src" :alt="alt" class="mx-auto h-auto max-w-full border border-border" loading="lazy">
    </button>
    <UiDialogContent class="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] border-border bg-background p-2 sm:max-w-6xl">
      <UiDialogTitle class="sr-only">{{ alt || "画像ビューアー" }}</UiDialogTitle>
      <div class="flex max-h-[calc(100vh-4rem)] items-center justify-center overflow-auto bg-sidebar p-2">
        <img :src="src" :alt="alt" class="max-h-[calc(100vh-5rem)] max-w-full object-contain">
      </div>
      <p v-if="alt" class="px-1 text-center text-xs text-muted-foreground">{{ alt }}</p>
    </UiDialogContent>
  </UiDialog>
</template>
