<script setup lang="ts">
import type { Page } from "~~/server/database/schema"

definePageMeta({ middleware: ["require-editor"] })

const route = useRoute()
const path = computed(() => {
  const raw = route.params.path
  return Array.isArray(raw) ? raw.join("/") : (raw ?? "")
})

const { data: existing } = await useFetch<Page>(() => `/api/pages/${path.value}`, {
  key: () => `page:${path.value}`,
})

const title = ref(existing.value?.title ?? path.value.split("/").pop() ?? "")
const description = ref(existing.value?.description ?? "")
const content = ref(existing.value?.content ?? "")
const savedTitle = ref(title.value)
const savedDescription = ref(description.value)
const savedContent = ref(content.value)
const saving = ref(false)
const errorMessage = ref("")
const leaveDialogOpen = ref(false)
const activeTab = ref<"frontmatter" | "editor" | "preview">("editor")
let resolveLeave: ((leave: boolean) => void) | null = null

const isDirty = computed(() => title.value !== savedTitle.value || description.value !== savedDescription.value || content.value !== savedContent.value)

async function save() {
  saving.value = true
  errorMessage.value = ""
  try {
    await $fetch<Page>(`/api/pages/${path.value}`, {
      method: "PUT",
      body: { title: title.value, description: description.value, content: content.value },
    })
    savedTitle.value = title.value
    savedDescription.value = description.value
    savedContent.value = content.value
    clearNuxtData(`page:${path.value}`)
    await navigateTo(path.value === "home" ? "/" : `/wiki/${path.value}`)
  } catch {
    errorMessage.value = "保存に失敗しました"
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(() => {
  if (!isDirty.value)
    return true

  leaveDialogOpen.value = true
  return new Promise<boolean>((resolve) => {
    resolveLeave = resolve
  })
})

function handleLeave(leave: boolean) {
  leaveDialogOpen.value = false
  resolveLeave?.(leave)
  resolveLeave = null
}

async function cancel() {
  await navigateTo(path.value === "home" ? "/" : `/wiki/${path.value}`)
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (isDirty.value)
    event.preventDefault()
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && !event.isComposing) {
    event.preventDefault()
    if (isDirty.value && !saving.value)
      save()
  }
}

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload)
  window.addEventListener("keydown", handleKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload)
  window.removeEventListener("keydown", handleKeydown)
})
</script>

<template>
  <div class="flex h-[calc(100vh-6.5rem)] flex-col gap-4">
    <h1 class="shrink-0 text-xl font-semibold">
      {{ existing ? 'ページを編集' : 'ページを作成' }}: {{ path }}
    </h1>
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="編集内容" class="flex items-center gap-1 md:hidden">
          <UiButton
            id="frontmatter-tab"
            role="tab"
            type="button"
            size="sm"
            :variant="activeTab === 'frontmatter' ? 'secondary' : 'ghost'"
            :aria-selected="activeTab === 'frontmatter'"
            aria-controls="frontmatter-panel"
            @click="activeTab = 'frontmatter'"
          >フロントマター</UiButton>
          <UiButton
            id="editor-tab"
            role="tab"
            type="button"
            size="sm"
            :variant="activeTab === 'editor' ? 'secondary' : 'ghost'"
            :aria-selected="activeTab === 'editor'"
            aria-controls="editor-panel"
            @click="activeTab = 'editor'"
          >Markdown</UiButton>
          <UiButton
            id="preview-tab"
            role="tab"
            type="button"
            size="sm"
            :variant="activeTab === 'preview' ? 'secondary' : 'ghost'"
            :aria-selected="activeTab === 'preview'"
            aria-controls="preview-panel"
            @click="activeTab = 'preview'"
          >プレビュー</UiButton>
        </div>
        <div class="mb-2 flex items-center gap-2">
          <span v-if="isDirty" class="text-sm text-muted-foreground">未保存の変更があります</span>
          <UiButton variant="outline" :disabled="saving" @click="cancel">キャンセル</UiButton>
          <UiButton :disabled="saving" @click="save">保存</UiButton>
        </div>
      </div>
      <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div
          id="frontmatter-panel"
          role="tabpanel"
          aria-labelledby="frontmatter-tab"
          class="min-h-0 overflow-auto border p-4"
          :class="activeTab === 'frontmatter' ? 'block' : 'hidden md:block'"
        >
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-sm font-medium" for="edit-title">タイトル</label>
              <UiInput id="edit-title" v-model="title" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium" for="edit-description">説明 <span class="text-muted-foreground">(任意)</span></label>
              <UiTextarea id="edit-description" v-model="description" class="min-h-28 resize-y" placeholder="ページの説明を入力" />
            </div>
          </div>
        </div>
        <MarkdownEditor
          id="editor-panel"
          role="tabpanel"
          aria-labelledby="editor-tab"
          v-model="content"
          view="edit"
          :class="activeTab === 'editor' ? 'flex' : 'hidden md:flex'"
        />
        <MarkdownEditor
          id="preview-panel"
          role="tabpanel"
          aria-labelledby="preview-tab"
          v-model="content"
          view="preview"
          :class="activeTab === 'preview' ? 'flex' : 'hidden md:flex'"
        />
      </div>
    </div>
    <p v-if="errorMessage" class="shrink-0 text-sm text-destructive">
      {{ errorMessage }}
    </p>
    <ConfirmDialog
      :open="leaveDialogOpen"
      title="未保存の変更があります"
      description="変更を保存せずにこのページを離れますか？"
      confirm-label="離れる"
      destructive
      @confirm="handleLeave(true)"
      @cancel="handleLeave(false)"
    />
  </div>
</template>
