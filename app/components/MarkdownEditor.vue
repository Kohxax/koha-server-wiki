<script setup lang="ts">
import { BoldIcon, CodeIcon, HeadingIcon, ImageIcon, LinkIcon, ShapesIcon } from '@lucide/vue'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const model = defineModel<string>({ required: true })

const props = withDefaults(defineProps<{
  view?: "edit" | "preview"
}>(), {
  view: "edit",
})

const textareaRef = ref<{ $el: HTMLTextAreaElement } | HTMLTextAreaElement | null>(null)
const preview = shallowRef<any>()
let previewTimer: ReturnType<typeof setTimeout> | undefined
let previewRequest = 0

async function updatePreview(value: string) {
  const request = ++previewRequest
  const parsed = await parseMarkdown(value)
  if (request === previewRequest)
    preview.value = parsed
}

watch(model, (value) => {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => void updatePreview(value), 150)
}, { immediate: true })

onBeforeUnmount(() => clearTimeout(previewTimer))

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
  <div class="flex min-h-0 flex-1 flex-col">
    <div v-if="props.view === 'edit'" class="flex min-h-0 flex-1 flex-col border">
      <div class="flex shrink-0 flex-wrap items-center gap-1 border-b bg-muted/40 p-1">
        <UiButton type="button" variant="ghost" size="sm" title="太字" @click="insertBold"><BoldIcon /></UiButton>
        <UiButton type="button" variant="ghost" size="sm" title="見出し" @click="insertHeading"><HeadingIcon /></UiButton>
        <UiButton type="button" variant="ghost" size="sm" title="外部リンク" @click="insertLink"><LinkIcon /></UiButton>
        <UiButton type="button" variant="ghost" size="sm" title="内部ページリンク" @click="internalLinkDialogOpen = true"><LinkIcon /></UiButton>
        <UiButton type="button" variant="ghost" size="sm" title="コードブロック" @click="insertCodeBlock"><CodeIcon /></UiButton>
        <UiButton type="button" variant="ghost" size="sm" title="画像" @click="mediaDialogOpen = true"><ImageIcon /></UiButton>
        <UiButton type="button" variant="ghost" size="sm" title="図表" @click="drawioDialogOpen = true"><ShapesIcon /></UiButton>
      </div>
      <div class="markdown-editor__scroll min-h-0 flex-1 overflow-auto">
        <UiTextarea ref="textareaRef" v-model="model" class="box-border block min-h-full resize-none border-0 pb-[calc(100vh-10rem)] font-mono" placeholder="Markdownで本文を入力" />
      </div>
    </div>
    <div v-else class="min-h-0 flex-1 overflow-auto border bg-muted/20 p-4">
      <MDCRenderer v-if="preview?.body" :body="preview.body" :data="preview.data" class="wiki-prose" />
    </div>

    <MediaLibraryDialog v-if="props.view === 'edit'" v-model:open="mediaDialogOpen" @insert="insertMedia" />
    <DrawioDialog v-if="props.view === 'edit'" v-model:open="drawioDialogOpen" @insert="insertMedia" />
    <InternalLinkDialog v-if="props.view === 'edit'" v-model:open="internalLinkDialogOpen" @insert="insertMedia" />
  </div>
</template>
