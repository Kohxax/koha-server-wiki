<script setup lang="ts">
import type { PageDto } from "~~/shared/types/api"
import { isValidPagePath, normalizePagePath } from "~~/shared/utils/page-path"
import { wikiPageUrl } from "~~/shared/utils/wiki-url"

definePageMeta({ middleware: ["require-editor"] })

const route = useRoute()
const path = computed(() => {
  const raw = route.params.path
  return Array.isArray(raw) ? raw.join("/") : (raw ?? "")
})

const { data: existing } = await useFetch<PageDto>(() => `/api/pages/${path.value}`, {
  key: () => `page:${path.value}`,
})

const title = ref(existing.value?.title ?? path.value.split("/").pop() ?? "")
const description = ref(existing.value?.description ?? "")
const content = ref(existing.value?.content ?? "")
const pagePath = ref(path.value)
const savedTitle = ref(title.value)
const savedDescription = ref(description.value)
const savedContent = ref(content.value)
const savedPath = ref(pagePath.value)
const expectedUpdatedAt = ref(existing.value?.updatedAt ?? null)
const saving = ref(false)
const errorMessage = ref("")
const leaveDialogOpen = ref(false)
const duplicateDialogOpen = ref(false)
const duplicatePath = ref("")
const duplicateTitle = ref("")
const duplicateError = ref("")
const duplicating = ref(false)
const activeTab = ref<"frontmatter" | "editor" | "preview">("editor")
let resolveLeave: ((leave: boolean) => void) | null = null

const isDirty = computed(() => title.value !== savedTitle.value || description.value !== savedDescription.value || content.value !== savedContent.value || pagePath.value !== savedPath.value)

async function save(returnToPage = true) {
  saving.value = true
  errorMessage.value = ""
  try {
    const savedPage = await $fetch<PageDto>(`/api/pages/${path.value}`, {
      method: "PUT",
      body: { path: pagePath.value, title: title.value, description: description.value, content: content.value, expectedUpdatedAt: expectedUpdatedAt.value },
    })
    savedTitle.value = title.value
    savedDescription.value = description.value
    savedContent.value = content.value
    pagePath.value = savedPage.path
    savedPath.value = savedPage.path
    expectedUpdatedAt.value = savedPage.updatedAt
    existing.value = savedPage
    clearNuxtData(`page:${path.value}`)
    clearNuxtData(`page:${savedPage.path}`)
    await Promise.all([refreshNuxtData("sidebar"), refreshNuxtData("editor-page-links")])
    if (returnToPage)
      await navigateTo(wikiPageUrl(savedPage.path))
  } catch {
    errorMessage.value = "保存に失敗しました"
  } finally {
    saving.value = false
  }
}

function openDuplicateDialog() {
  duplicatePath.value = `${savedPath.value}-copy`
  duplicateTitle.value = `${savedTitle.value}のコピー`
  duplicateError.value = ""
  duplicateDialogOpen.value = true
}

function closeDuplicateDialog() {
  if (!duplicating.value)
    duplicateDialogOpen.value = false
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
    const duplicated = await $fetch<PageDto>(`/api/pages/${savedPath.value}`, {
      method: "POST",
      body: { path: targetPath, title: targetTitle },
    })
    duplicateDialogOpen.value = false
    await Promise.all([refreshNuxtData("sidebar"), refreshNuxtData("editor-page-links")])
    await navigateTo(`/edit/${duplicated.path}`)
  } catch {
    duplicateError.value = "ページの複製に失敗しました。パスが重複していないか確認してください"
  } finally {
    duplicating.value = false
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
  await navigateTo(wikiPageUrl(path.value))
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (isDirty.value)
    event.preventDefault()
}

function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && !event.isComposing) {
    event.preventDefault()
    if (isDirty.value && !saving.value)
      void save(false)
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
        <div role="tablist" aria-label="編集内容" class="flex items-center gap-1 border border-sidebar-border bg-sidebar p-1 dark:border-0 dark:bg-transparent dark:p-0 md:hidden">
          <UiButton
            id="frontmatter-tab"
            role="tab"
            type="button"
            size="sm"
            :variant="activeTab === 'frontmatter' ? 'secondary' : 'ghost'"
            :class="activeTab === 'frontmatter' ? 'bg-sidebar-accent hover:bg-sidebar-accent dark:bg-secondary dark:hover:bg-secondary/80' : ''"
            :aria-selected="activeTab === 'frontmatter'"
            aria-controls="frontmatter-panel"
            @click="activeTab = 'frontmatter'"
          >ページ設定</UiButton>
          <UiButton
            id="editor-tab"
            role="tab"
            type="button"
            size="sm"
            :variant="activeTab === 'editor' ? 'secondary' : 'ghost'"
            :class="activeTab === 'editor' ? 'bg-sidebar-accent hover:bg-sidebar-accent dark:bg-secondary dark:hover:bg-secondary/80' : ''"
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
            :class="activeTab === 'preview' ? 'bg-sidebar-accent hover:bg-sidebar-accent dark:bg-secondary dark:hover:bg-secondary/80' : ''"
            :aria-selected="activeTab === 'preview'"
            aria-controls="preview-panel"
            @click="activeTab = 'preview'"
          >プレビュー</UiButton>
        </div>
        <div class="mb-2 ml-auto flex items-center gap-2">
          <span v-if="isDirty" class="text-sm text-muted-foreground">未保存の変更があります</span>
          <span v-if="existing && isDirty" class="text-sm text-muted-foreground">保存後に複製できます</span>
          <UiButton v-if="existing" variant="outline" class="bg-sidebar hover:bg-sidebar-accent" :disabled="saving || isDirty" @click="openDuplicateDialog">複製</UiButton>
          <UiButton variant="outline" class="bg-sidebar hover:bg-sidebar-accent" :disabled="saving" @click="cancel">キャンセル</UiButton>
          <UiButton :disabled="saving" @click="save">保存</UiButton>
        </div>
      </div>
      <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(12rem,0.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div
          id="frontmatter-panel"
          role="tabpanel"
          aria-labelledby="frontmatter-tab"
          class="min-h-0 overflow-auto border border-sidebar-border bg-sidebar p-4 dark:bg-transparent"
          :class="activeTab === 'frontmatter' ? 'block' : 'hidden md:block'"
        >
          <div class="space-y-4">
            <h2 class="text-sm font-semibold">ページ設定</h2>
            <div class="space-y-1">
              <label class="text-sm font-medium" for="edit-title">タイトル</label>
              <UiInput id="edit-title" v-model="title" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium" for="edit-description">説明 <span class="text-muted-foreground">(任意)</span></label>
              <UiTextarea id="edit-description" v-model="description" class="min-h-28 resize-y" placeholder="ページの説明を入力" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium" for="edit-path">パス</label>
              <UiInput id="edit-path" v-model="pagePath" :disabled="path === 'home'" placeholder="build/farm" />
              <p v-if="path === 'home'" class="text-xs text-muted-foreground">トップページのパスは変更できません</p>
              <p v-else class="text-xs text-muted-foreground">変更すると既存の内部リンクは自動更新されません</p>
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
    <UiDialog :open="duplicateDialogOpen" @update:open="(open) => { if (!open) closeDuplicateDialog() }">
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
          <UiButton type="button" variant="outline" :disabled="duplicating" @click="closeDuplicateDialog">キャンセル</UiButton>
          <UiButton type="button" :disabled="duplicating" @click="duplicate">{{ duplicating ? "複製中..." : "複製" }}</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>
