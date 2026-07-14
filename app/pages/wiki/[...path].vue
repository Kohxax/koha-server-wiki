<script setup lang="ts">
const route = useRoute()
const path = computed(() => {
  const raw = route.params.path
  return Array.isArray(raw) ? raw.join("/") : (raw ?? "")
})
</script>

<template>
  <PageViewer :path="path" />
</template>
