<script setup lang="ts">
import type { Media } from "~~/server/database/schema"

definePageMeta({ middleware: ["require-editor"] })

const { data: items, refresh } = await useFetch<Media[]>("/api/media", { key: "admin-media" })
const deletingId = ref<number | null>(null)

async function remove(item: Media) {
  if (!confirm(`「${item.originalName}」を削除しますか?`))
    return
  deletingId.value = item.id
  try {
    await $fetch(`/api/media/${item.id}`, { method: "DELETE" })
    await refresh()
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl py-6">
    <h1 class="mb-6 text-xl font-semibold">
      メディア管理
    </h1>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <UiCard v-for="item in items" :key="item.id">
        <UiCardContent class="p-2">
          <img :src="`/uploads/${item.filename}`" :alt="item.originalName" class="aspect-square w-full rounded object-cover">
          <p class="mt-1 truncate text-xs" :title="item.originalName">
            {{ item.originalName }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ item.kind }} / {{ Math.round(item.size / 1024) }}KB
          </p>
          <UiButton
            variant="destructive"
            size="sm"
            class="mt-2 w-full"
            :disabled="deletingId === item.id"
            @click="remove(item)"
          >
            削除
          </UiButton>
        </UiCardContent>
      </UiCard>
    </div>
    <p v-if="items && items.length === 0" class="text-sm text-muted-foreground">
      まだメディアがありません
    </p>
  </div>
</template>
