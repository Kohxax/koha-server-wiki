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
    <div class="shrink-0 space-y-3">
      <label class="text-sm font-medium" for="edit-title">タイトル</label>
      <UiInput id="edit-title" v-model="title" class="max-w-md" />
      <div class="space-y-1">
        <label class="text-sm font-medium" for="edit-description">説明 <span class="text-muted-foreground">(任意)</span></label>
        <UiTextarea id="edit-description" v-model="description" class="min-h-20 max-w-2xl resize-y" placeholder="ページの説明を入力" />
      </div>
    </div>
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-medium">本文 (Markdown)</span>
        <div class="flex items-center gap-2 mb-2">
          <span v-if="isDirty" class="text-sm text-muted-foreground">未保存の変更があります</span>
          <UiButton variant="outline" :disabled="saving" @click="cancel">キャンセル</UiButton>
          <UiButton :disabled="saving" @click="save">保存</UiButton>
        </div>
      </div>
      <MarkdownEditor v-model="content" />
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
