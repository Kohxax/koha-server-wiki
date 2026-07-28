<script setup lang="ts">
import type { PageDto } from "~~/shared/types/api"
import { isValidPagePath, normalizePagePath } from "~~/shared/utils/page-path"

const props = defineProps<{
  open: boolean
  sourcePath: string
  sourceTitle: string
}>()
const emit = defineEmits<{ "update:open": [value: boolean] }>()

const duplicatePath = ref("")
const duplicateTitle = ref("")
const duplicateError = ref("")
const duplicating = ref(false)

watch(() => props.open, (isOpen) => {
  if (!isOpen)
    return
  duplicatePath.value = `${props.sourcePath}-copy`
  duplicateTitle.value = `${props.sourceTitle}のコピー`
  duplicateError.value = ""
})

function close() {
  if (!duplicating.value)
    emit("update:open", false)
}

async function duplicate() {
  const targetPath = normalizePagePath(duplicatePath.value)
  const targetTitle = duplicateTitle.value.trim()
  if (!isValidPagePath(targetPath)) {
    duplicateError.value = "有効なページパスを入力してください"
    return
  }
  if (!targetTitle) {
    duplicateError.value = "タイトルを入力してください"
    return
  }

  duplicating.value = true
  duplicateError.value = ""
  try {
    const duplicated = await $fetch<PageDto>(`/api/pages/${props.sourcePath}`, {
      method: "POST",
      body: { path: targetPath, title: targetTitle },
    })
    emit("update:open", false)
    await Promise.all([refreshNuxtData("sidebar"), refreshPageTree()])
    await navigateTo(`/edit/${duplicated.path}`)
  } catch {
    duplicateError.value = "ページの複製に失敗しました。パスが重複していないか確認してください"
  } finally {
    duplicating.value = false
  }
}
</script>

<template>
  <UiDialog :open="open" @update:open="(next) => { if (!next) close() }">
    <UiDialogContent :show-close-button="!duplicating">
      <UiDialogHeader>
        <UiDialogTitle>ページを複製</UiDialogTitle>
        <UiDialogDescription>本文と説明をコピーして、新しいページを作成します。</UiDialogDescription>
      </UiDialogHeader>
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-sm font-medium" for="duplicate-path">新しいパス</label>
          <UiInput id="duplicate-path" v-model="duplicatePath" :disabled="duplicating" placeholder="build/farm-copy" />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-medium" for="duplicate-title">タイトル</label>
          <UiInput id="duplicate-title" v-model="duplicateTitle" :disabled="duplicating" />
        </div>
        <p v-if="duplicateError" class="text-sm text-destructive">{{ duplicateError }}</p>
      </div>
      <UiDialogFooter>
        <UiButton type="button" variant="outline" :disabled="duplicating" @click="close">キャンセル</UiButton>
        <UiButton type="button" :disabled="duplicating" @click="duplicate">{{ duplicating ? "複製中..." : "複製" }}</UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
