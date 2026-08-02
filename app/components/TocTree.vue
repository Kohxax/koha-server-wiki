<script setup lang="ts">
import type { TocEntry } from "~~/shared/types/api"

defineProps<{ entries: TocEntry[], activeId: string | null }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <ul class="space-y-2">
    <li v-for="entry in entries" :key="entry.id">
      <a
        :href="`#${entry.id}`"
        :data-toc-id="entry.id"
        :aria-current="activeId === entry.id ? 'location' : undefined"
        class="block transition-colors hover:text-primary"
        :class="[
          entry.depth > 2 ? 'border-l pl-3' : '',
          activeId === entry.id ? 'border-primary bg-accent font-medium text-primary' : 'border-border text-muted-foreground',
        ]"
        @click.prevent="emit('select', entry.id)"
      >{{ entry.text }}</a>
      <TocTree v-if="entry.children?.length" :entries="entry.children" :active-id="activeId" class="mt-2 ml-3" @select="emit('select', $event)" />
    </li>
  </ul>
</template>
