<script setup lang="ts">
interface RevisionEntry {
  id: number
  pageId: number
  title: string
  content: string
  createdAt: string
  editedByUsername: string | null
}

interface HistoryResponse {
  current: {
    title: string
    content: string
    updatedAt: string
    updatedByUsername: string | null
  }
  revisions: RevisionEntry[]
}

const route = useRoute()
const path = computed(() => {
  const raw = route.params.path
  return Array.isArray(raw) ? raw.join("/") : (raw ?? "")
})

const { data, status } = await useFetch<HistoryResponse>(() => `/api/page-revisions/${path.value}`, {
  key: () => `history:${path.value}`,
})

type Selected = { kind: "current" } | { kind: "revision", id: number }
const selected = ref<Selected>({ kind: "current" })

const selectedEntry = computed(() => {
  if (!data.value)
    return null
  const current = selected.value
  if (current.kind === "current") {
    return {
      title: data.value.current.title,
      content: data.value.current.content,
      at: data.value.current.updatedAt,
      by: data.value.current.updatedByUsername,
    }
  }
  const revision = data.value.revisions.find(r => r.id === current.id)
  return revision
    ? { title: revision.title, content: revision.content, at: revision.createdAt, by: revision.editedByUsername }
    : null
})

useHead({ title: () => `履歴: ${data.value?.current.title ?? path.value}` })
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-4 py-6">
    <h1 class="text-xl font-semibold">
      履歴: {{ path }}
    </h1>

    <div v-if="status === 'pending'">
      <UiSkeleton class="h-40 w-full" />
    </div>

    <div v-else-if="data" class="grid gap-4 md:grid-cols-[16rem_1fr]">
      <UiScrollArea class="h-[32rem] rounded-md border p-2">
        <ul class="space-y-1 text-sm">
          <li>
            <button
              type="button"
              class="w-full rounded px-2 py-1 text-left hover:bg-muted"
              :class="{ 'bg-muted font-medium': selected.kind === 'current' }"
              @click="selected = { kind: 'current' }"
            >
              現在の版
              <div class="text-xs text-muted-foreground">
                {{ new Date(data.current.updatedAt).toLocaleString('ja-JP') }} / {{ data.current.updatedByUsername ?? '不明' }}
              </div>
            </button>
          </li>
          <li v-for="revision in data.revisions" :key="revision.id">
            <button
              type="button"
              class="w-full rounded px-2 py-1 text-left hover:bg-muted"
              :class="{ 'bg-muted font-medium': selected.kind === 'revision' && selected.id === revision.id }"
              @click="selected = { kind: 'revision', id: revision.id }"
            >
              {{ revision.title }}
              <div class="text-xs text-muted-foreground">
                {{ new Date(revision.createdAt).toLocaleString('ja-JP') }} / {{ revision.editedByUsername ?? '不明' }}
              </div>
            </button>
          </li>
          <li v-if="data.revisions.length === 0" class="px-2 py-1 text-xs text-muted-foreground">
            過去の編集履歴はありません
          </li>
        </ul>
      </UiScrollArea>

      <article v-if="selectedEntry" class="rounded-md border p-4">
        <h2 class="mb-2 text-lg font-bold">
          {{ selectedEntry.title }}
        </h2>
        <MDC :value="selectedEntry.content" tag="div" class="prose dark:prose-invert max-w-none" />
      </article>
    </div>
  </div>
</template>
