<script setup lang="ts">
import type { MediaDto, MediaReferenceDto } from "~~/shared/types/api"
import { apiErrorMessage } from "~~/shared/utils/api-error"
import { wikiPageUrl } from "~~/shared/utils/wiki-url"

definePageMeta({ middleware: ["require-editor"] })

const { data: items, refresh } = await useFetch<MediaDto[]>("/api/media", { key: "admin-media" })
const deletingId = ref<number | null>(null)
const checkingId = ref<number | null>(null)
const itemToDelete = ref<MediaDto | null>(null)
const mediaInUse = ref<{ item: MediaDto, references: MediaReferenceDto[] } | null>(null)
const errorMessage = ref("")

useHead({ title: "メディア管理" })

async function requestRemove(item: MediaDto) {
  errorMessage.value = ""
  checkingId.value = item.id
  try {
    const references = await $fetch<MediaReferenceDto[]>(`/api/media/${item.id}/references`)
    if (references.length) {
      mediaInUse.value = { item, references }
      return
    }
    itemToDelete.value = item
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "メディアの使用状況を確認できませんでした")
  } finally {
    checkingId.value = null
  }
}

async function remove() {
  const item = itemToDelete.value
  if (!item)
    return

  itemToDelete.value = null
  deletingId.value = item.id
  errorMessage.value = ""
  try {
    await $fetch(`/api/media/${item.id}`, { method: "DELETE" })
    await refresh()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "メディアを削除できませんでした")
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
    <div data-image-viewer-group class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <UiCard v-for="item in items" :key="item.id">
        <UiCardContent class="p-2">
          <ImageViewer :src="`/uploads/${item.filename}`" :alt="item.originalName" image-class="aspect-square w-full object-cover" />
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
            :disabled="deletingId === item.id || checkingId === item.id"
            @click="requestRemove(item)"
          >
            削除
          </UiButton>
        </UiCardContent>
      </UiCard>
    </div>
    <p v-if="items && items.length === 0" class="text-sm text-muted-foreground">
      まだメディアがありません
    </p>
    <p v-if="errorMessage" class="mt-4 text-sm text-destructive">{{ errorMessage }}</p>
    <ConfirmDialog
      :open="!!itemToDelete"
      title="メディアを削除しますか？"
      :description="itemToDelete ? `「${itemToDelete.originalName}」は元に戻せません。` : ''"
      confirm-label="削除"
      destructive
      @confirm="remove"
      @cancel="itemToDelete = null"
    />
    <UiDialog :open="!!mediaInUse" @update:open="(open) => { if (!open) mediaInUse = null }">
      <UiDialogContent :show-close-button="false">
        <UiDialogHeader>
          <UiDialogTitle>使用中のメディアです</UiDialogTitle>
          <UiDialogDescription>
            「{{ mediaInUse?.item.originalName }}」は以下のページで使用されているため、削除できません。
          </UiDialogDescription>
        </UiDialogHeader>
        <ul class="space-y-2 text-sm">
          <li v-for="reference in mediaInUse?.references" :key="reference.path">
            <NuxtLink :to="wikiPageUrl(reference.path)" class="text-primary underline underline-offset-2">
              {{ reference.title }}
            </NuxtLink>
            <span class="ml-2 font-mono text-xs text-muted-foreground">{{ reference.path }}</span>
          </li>
        </ul>
        <UiDialogFooter>
          <UiButton type="button" @click="mediaInUse = null">閉じる</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>
