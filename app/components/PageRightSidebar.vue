<script setup lang="ts">
import { HistoryIcon } from "@lucide/vue"
import type { TocEntry } from "~~/shared/types/api"

const props = defineProps<{
  canEdit: boolean
  editTo: string
  toc: TocEntry[]
  activeHeadingId: string | null
  updatedByUsername: string | null
  updatedAt: string
}>()

const emit = defineEmits<{ selectHeading: [id: string] }>()
const tocSectionRef = ref<HTMLElement>()

async function scrollActiveTocEntryIntoView() {
  if (!props.activeHeadingId)
    return
  await nextTick()
  const section = tocSectionRef.value
  if (!section)
    return

  const link = [...section.querySelectorAll<HTMLAnchorElement>("a[data-toc-id]")]
    .find(candidate => candidate.dataset.tocId === props.activeHeadingId)
  link?.scrollIntoView({ block: "nearest" })
}

watch(() => props.activeHeadingId, scrollActiveTocEntryIntoView, { flush: "post", immediate: true })
</script>

<template>
  <aside class="hidden self-start space-y-6 text-sm lg:col-start-2 lg:row-start-2 lg:sticky lg:top-20 lg:block">
    <div v-if="canEdit">
      <UiButton variant="outline" size="sm" class="bg-sidebar hover:bg-sidebar-accent" as-child>
        <NuxtLink :to="editTo">編集</NuxtLink>
      </UiButton>
    </div>
    <section v-if="toc.length" ref="tocSectionRef" class="wiki-scrollbar max-h-[calc(100dvh-16rem)] overflow-y-auto border border-sidebar-border bg-sidebar p-4 transition-colors dark:bg-muted/30">
      <h2 class="mb-3 font-semibold">目次</h2>
      <nav>
        <TocTree :entries="toc" :active-id="activeHeadingId" @select="emit('selectHeading', $event)" />
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
