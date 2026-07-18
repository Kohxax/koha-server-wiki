<script setup lang="ts">
withDefaults(defineProps<{
  src?: string
  alt?: string
}>(), {
  src: '',
  alt: '',
})
</script>

<template>
  <figure class="my-6">
    <ImageViewer :src="src" :alt="alt" />
    <figcaption v-if="alt" class="mt-2 text-center text-xs text-muted-foreground">
      {{ alt }}
    </figcaption>
  </figure>
</template>
