<script setup lang="ts">
import { HistoryIcon } from "@lucide/vue"

interface TocEntry {
  id: string
  text: string
  depth: number
  children?: TocEntry[]
}

defineProps<{
  canEdit: boolean
  editTo: string
  toc: TocEntry[]
  updatedByUsername: string | null
  updatedAt: string
}>()

const emit = defineEmits<{ selectHeading: [id: string] }>()
</script>

<template>
  <aside class="order-2 hidden self-start space-y-6 text-sm lg:sticky lg:top-20 lg:block">
    <UiButton v-if="canEdit" variant="outline" size="sm" class="w-full bg-sidebar hover:bg-sidebar-accent" as-child>
      <NuxtLink :to="editTo">編集</NuxtLink>
    </UiButton>
    <section v-if="toc.length" class="wiki-scrollbar max-h-[calc(100dvh-16rem)] overflow-y-auto border border-sidebar-border bg-sidebar p-4 transition-colors dark:bg-muted/30">
      <h2 class="mb-3 font-semibold">目次</h2>
      <nav>
        <TocTree :entries="toc" @select="emit('selectHeading', $event)" />
      </nav>
    </section>
    <section class="border border-sidebar-border bg-sidebar p-4 text-muted-foreground dark:bg-muted/30">
      <div class="flex items-start gap-2">
        <HistoryIcon class="mt-0.5 size-4 shrink-0" />
        <p>最終更新: {{ updatedByUsername ?? "不明" }}<br>（{{ updatedAt }}）</p>
      </div>
    </section>
  </aside>
</template>
