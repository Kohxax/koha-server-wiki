<script setup lang="ts">
const model = defineModel<string>({ required: true })

const textareaRef = ref<{ $el: HTMLTextAreaElement } | HTMLTextAreaElement | null>(null)
const mobileView = ref<"edit" | "preview">("edit")
const previewContent = ref(model.value)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(model, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    previewContent.value = value
  }, 300)
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

function insertMedia(markdown: string) {
  insertAtCursor(markdown)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-1 rounded-md border p-1">
      <UiButton type="button" variant="ghost" size="sm" title="太字" @click="insertBold">
        B
      </UiButton>
      <UiButton type="button" variant="ghost" size="sm" title="見出し" @click="insertHeading">
        H
      </UiButton>
      <UiButton type="button" variant="ghost" size="sm" title="リンク" @click="insertLink">
        🔗
      </UiButton>
      <UiButton type="button" variant="ghost" size="sm" title="コードブロック" @click="insertCodeBlock">
        {{ '</>' }}
      </UiButton>
      <UiButton type="button" variant="ghost" size="sm" title="画像" @click="mediaDialogOpen = true">
        🖼️
      </UiButton>
      <UiButton type="button" variant="ghost" size="sm" title="図表" @click="drawioDialogOpen = true">
        📐
      </UiButton>
      <div class="flex-1" />
      <div class="flex gap-1 md:hidden">
        <UiButton type="button" size="sm" :variant="mobileView === 'edit' ? 'secondary' : 'ghost'" @click="mobileView = 'edit'">
          編集
        </UiButton>
        <UiButton type="button" size="sm" :variant="mobileView === 'preview' ? 'secondary' : 'ghost'" @click="mobileView = 'preview'">
          プレビュー
        </UiButton>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <UiTextarea
        ref="textareaRef"
        v-model="model"
        class="min-h-[24rem] font-mono md:block"
        :class="mobileView === 'edit' ? 'block' : 'hidden'"
        placeholder="Markdownで本文を入力"
      />
      <div
        class="min-h-[24rem] rounded-md border p-4 md:block"
        :class="mobileView === 'preview' ? 'block' : 'hidden'"
      >
        <MDC :value="previewContent" tag="div" class="prose dark:prose-invert max-w-none" />
      </div>
    </div>

    <MediaLibraryDialog v-model:open="mediaDialogOpen" @insert="insertMedia" />
    <DrawioDialog v-model:open="drawioDialogOpen" @insert="insertMedia" />
  </div>
</template>
