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
const content = ref(existing.value?.content ?? "")
const savedTitle = ref(title.value)
const savedContent = ref(content.value)
const saving = ref(false)
const errorMessage = ref("")

const isDirty = computed(() => title.value !== savedTitle.value || content.value !== savedContent.value)

async function save() {
  saving.value = true
  errorMessage.value = ""
  try {
    await $fetch<Page>(`/api/pages/${path.value}`, {
      method: "PUT",
      body: { title: title.value, content: content.value },
    })
    savedTitle.value = title.value
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
  if (isDirty.value && !confirm("保存されていない変更があります。ページを離れますか?"))
    return false
})

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (isDirty.value)
    event.preventDefault()
}

onMounted(() => window.addEventListener("beforeunload", handleBeforeUnload))
onBeforeUnmount(() => window.removeEventListener("beforeunload", handleBeforeUnload))
</script>

<template>
  <div class="flex h-[calc(100vh-6.5rem)] flex-col gap-4">
    <h1 class="text-xl font-semibold">
      {{ existing ? 'ページを編集' : 'ページを作成' }}: {{ path }}
    </h1>
    <div>
      <label class="text-sm font-medium" for="edit-title">タイトル</label>
      <UiInput id="edit-title" v-model="title" class="max-w-md" />
    </div>
    <div class="flex flex-1 flex-col">
      <span class="text-sm font-medium">本文 (Markdown)</span>
      <MarkdownEditor v-model="content" />
    </div>
    <p v-if="errorMessage" class="text-sm text-destructive">
      {{ errorMessage }}
    </p>
    <div class="flex items-center justify-end gap-2">
      <span v-if="isDirty" class="text-sm text-muted-foreground">未保存の変更があります</span>
      <UiButton :disabled="saving" @click="save">
        保存
      </UiButton>
    </div>
  </div>
</template>
