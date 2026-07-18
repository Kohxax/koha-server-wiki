<script setup lang="ts">
import type { MediaDto } from "~~/shared/types/api"

const open = defineModel<boolean>("open", { default: false })
const emit = defineEmits<{ insert: [markdown: string] }>()

const { data: items, refresh } = await useFetch<MediaDto[]>("/api/media", {
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

function selectItem(item: MediaDto) {
  emit("insert", `![${item.originalName}](/uploads/${item.filename})`)
  open.value = false
}

const drawioDialogOpen = ref(false)
const editingMediaId = ref<number | undefined>(undefined)
const editingXml = ref("")

async function editDiagram(item: MediaDto) {
  editingXml.value = await $fetch<string>(`/uploads/${item.filename}`, { responseType: "text" })
  editingMediaId.value = item.id
  drawioDialogOpen.value = true
}

async function onDiagramSaved() {
  await refresh()
}
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="max-h-[90vh] max-w-4xl sm:max-w-4xl">
      <UiDialogHeader>
        <UiDialogTitle>メディアライブラリ</UiDialogTitle>
      </UiDialogHeader>

      <div
        class="border border-dashed p-4 text-center text-sm text-muted-foreground"
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

      <UiScrollArea class="h-[60vh]">
        <div class="grid grid-cols-3 gap-2 p-1 sm:grid-cols-5">
          <div
            v-for="item in items"
            :key="item.id"
            class="group relative aspect-square overflow-hidden border"
          >
            <button
              type="button"
              class="h-full w-full hover:ring-2 hover:ring-ring"
              :title="item.originalName"
              @click="selectItem(item)"
            >
              <img :src="`/uploads/${item.filename}`" :alt="item.originalName" class="h-full w-full object-cover">
            </button>
            <UiButton
              v-if="item.kind === 'diagram'"
              type="button"
              size="sm"
              variant="secondary"
              class="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100"
              @click.stop="editDiagram(item)"
            >
              draw.ioで編集
            </UiButton>
          </div>
        </div>
        <p v-if="items && items.length === 0" class="p-4 text-center text-sm text-muted-foreground">
          まだ画像がありません
        </p>
      </UiScrollArea>
    </UiDialogContent>

    <DrawioDialog
      v-model:open="drawioDialogOpen"
      :initial-xml="editingXml"
      :editing-media-id="editingMediaId"
      @saved="onDiagramSaved"
    />
  </UiDialog>
</template>
