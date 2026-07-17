<script setup lang="ts">
interface TocEntry {
  id: string
  text: string
  depth: number
  children?: TocEntry[]
}

defineProps<{ entries: TocEntry[] }>()
</script>

<template>
  <ul class="space-y-2">
    <li v-for="entry in entries" :key="entry.id">
      <a
        :href="`#${entry.id}`"
        class="block text-muted-foreground transition-colors hover:text-primary"
        :class="{ 'border-l border-border pl-3': entry.depth > 2 }"
      >{{ entry.text }}</a>
      <TocTree v-if="entry.children?.length" :entries="entry.children" class="mt-2 ml-3" />
    </li>
  </ul>
</template>
