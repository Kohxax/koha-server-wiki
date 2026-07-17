<script setup lang="ts">
import { BoldIcon, CodeIcon, HeadingIcon, ImageIcon, LinkIcon, ShapesIcon } from '@lucide/vue'

const model = defineModel<string>({ required: true })

const textareaRef = ref<{ $el: HTMLTextAreaElement } | HTMLTextAreaElement | null>(null)
const mobileView = ref<"edit" | "preview">("edit")
// MDC does not reliably reparse its value after mount. Keep a separate rendered
// value and remount only the preview pane when the editor changes.
const previewContent = ref(model.value)

watch(model, (value) => {
  previewContent.value = value
}, { immediate: true })

function getTextareaEl(): HTMLTextAreaElement | null {
  const el = textareaRef.value
  if (!el)
    return null
  return "$el" in el ? el.$el : el
}

function insertAtCursor(before: string, after = "", placeholder = "") {
  const el = getTextareaEl()
  if (!el) {
    model.value += before + placeholder + after
    return
  }

  const start = el.selectionStart ?? model.value.length
  const end = el.selectionEnd ?? model.value.length
  const selected = model.value.slice(start, end) || placeholder
  const next = `${model.value.slice(0, start)}${before}${selected}${after}${model.value.slice(end)}`
  model.value = next

  nextTick(() => {
    el.focus()
    const cursor = start + before.length + selected.length + after.length
    el.setSelectionRange(cursor, cursor)
  })
}

function insertBold() {
  insertAtCursor("**", "**", "太字")
}
function insertHeading() {
  insertAtCursor("## ", "", "見出し")
}
function insertLink() {
  insertAtCursor("[", "](https://example.com)", "リンク")
}
function insertCodeBlock() {
  insertAtCursor("```\n", "\n```", "コード")
}

const mediaDialogOpen = ref(false)
const drawioDialogOpen = ref(false)
const internalLinkDialogOpen = ref(false)

function insertMedia(markdown: string) {
  insertAtCursor(markdown)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-2">
    <div class="flex shrink-0 justify-end gap-1 md:hidden">
      <UiButton type="button" size="sm" :variant="mobileView === 'edit' ? 'secondary' : 'ghost'" @click="mobileView = 'edit'">編集</UiButton>
      <UiButton type="button" size="sm" :variant="mobileView === 'preview' ? 'secondary' : 'ghost'" @click="mobileView = 'preview'">プレビュー</UiButton>
    </div>

    <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
      <div class="flex min-h-0 flex-col border" :class="mobileView === 'edit' ? 'flex' : 'hidden md:flex'">
        <div class="flex shrink-0 flex-wrap items-center gap-1 border-b bg-muted/40 p-1">
          <UiButton type="button" variant="ghost" size="sm" title="太字" @click="insertBold"><BoldIcon /></UiButton>
          <UiButton type="button" variant="ghost" size="sm" title="見出し" @click="insertHeading"><HeadingIcon /></UiButton>
          <UiButton type="button" variant="ghost" size="sm" title="外部リンク" @click="insertLink"><LinkIcon /></UiButton>
          <UiButton type="button" variant="ghost" size="sm" title="内部ページリンク" @click="internalLinkDialogOpen = true"><LinkIcon /></UiButton>
          <UiButton type="button" variant="ghost" size="sm" title="コードブロック" @click="insertCodeBlock"><CodeIcon /></UiButton>
          <UiButton type="button" variant="ghost" size="sm" title="画像" @click="mediaDialogOpen = true"><ImageIcon /></UiButton>
          <UiButton type="button" variant="ghost" size="sm" title="図表" @click="drawioDialogOpen = true"><ShapesIcon /></UiButton>
        </div>
        <UiTextarea ref="textareaRef" v-model="model" class="min-h-0 flex-1 resize-none border-0 pb-[calc(100vh-10rem)] font-mono field-sizing-fixed" placeholder="Markdownで本文を入力" />
      </div>
      <div
        class="min-h-0 overflow-auto border bg-muted/20 p-4"
        :class="mobileView === 'preview' ? 'block' : 'hidden md:block'"
      >
        <MDC :key="previewContent" :value="previewContent" tag="div" class="wiki-prose" />
      </div>
    </div>

    <MediaLibraryDialog v-model:open="mediaDialogOpen" @insert="insertMedia" />
    <DrawioDialog v-model:open="drawioDialogOpen" @insert="insertMedia" />
    <InternalLinkDialog v-model:open="internalLinkDialogOpen" @insert="insertMedia" />
  </div>
</template>
