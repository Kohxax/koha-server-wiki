<script setup lang="ts">
import type { Media } from "~~/server/database/schema"

const open = defineModel<boolean>("open", { default: false })
const emit = defineEmits<{ insert: [markdown: string] }>()

const { data: items, refresh } = await useFetch<Media[]>("/api/media", {
  key: "media-library",
  immediate: false,
})

const uploading = ref(false)
const errorMessage = ref("")
const fileInput = ref<HTMLInputElement | null>(null)

watch(open, (value) => {
  if (value)
    refresh()
})

async function uploadFiles(files: FileList | null) {
  if (!files || files.length === 0)
    return
  uploading.value = true
  errorMessage.value = ""
  try {
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append("file", file)
      await $fetch("/api/media", { method: "POST", body: form })
    }
    await refresh()
  } catch {
    errorMessage.value = "アップロードに失敗しました"
  } finally {
    uploading.value = false
    if (fileInput.value)
      fileInput.value.value = ""
  }
}

function onDrop(event: DragEvent) {
  uploadFiles(event.dataTransfer?.files ?? null)
}

function selectItem(item: Media) {
  emit("insert", `![${item.originalName}](/uploads/${item.filename})`)
  open.value = false
}
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="max-w-2xl">
      <UiDialogHeader>
        <UiDialogTitle>メディアライブラリ</UiDialogTitle>
      </UiDialogHeader>

      <div
        class="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <p>画像をドラッグ&ドロップ、またはクリックして選択</p>
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          class="mt-2 w-full text-xs"
          :disabled="uploading"
          @change="uploadFiles(($event.target as HTMLInputElement).files)"
        >
        <p v-if="uploading" class="mt-2">
          アップロード中...
        </p>
        <p v-if="errorMessage" class="mt-2 text-destructive">
          {{ errorMessage }}
        </p>
      </div>

      <UiScrollArea class="h-72">
        <div class="grid grid-cols-3 gap-2 p-1 sm:grid-cols-4">
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="group relative aspect-square overflow-hidden rounded-md border hover:ring-2 hover:ring-ring"
            :title="item.originalName"
            @click="selectItem(item)"
          >
            <img :src="`/uploads/${item.filename}`" :alt="item.originalName" class="h-full w-full object-cover">
          </button>
        </div>
        <p v-if="items && items.length === 0" class="p-4 text-center text-sm text-muted-foreground">
          まだ画像がありません
        </p>
      </UiScrollArea>
    </UiDialogContent>
  </UiDialog>
</template>
