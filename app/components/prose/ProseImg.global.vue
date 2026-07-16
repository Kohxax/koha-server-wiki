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
    <img :src="src" :alt="alt" class="mx-auto h-auto max-w-full border border-border" loading="lazy">
    <figcaption v-if="alt" class="mt-2 text-center text-xs text-muted-foreground">
      {{ alt }}
    </figcaption>
  </figure>
</template>
