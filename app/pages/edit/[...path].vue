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
const saving = ref(false)
const errorMessage = ref("")

async function save() {
  saving.value = true
  errorMessage.value = ""
  try {
    await $fetch<Page>(`/api/pages/${path.value}`, {
      method: "PUT",
      body: { title: title.value, content: content.value },
    })
    await navigateTo(path.value === "home" ? "/" : `/wiki/${path.value}`)
  } catch {
    errorMessage.value = "保存に失敗しました"
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-3xl flex-col gap-4 py-6">
    <h1 class="text-xl font-semibold">
      {{ existing ? 'ページを編集' : 'ページを作成' }}: {{ path }}
    </h1>
    <div>
      <label class="text-sm font-medium" for="edit-title">タイトル</label>
      <UiInput id="edit-title" v-model="title" />
    </div>
    <div>
      <label class="text-sm font-medium" for="edit-content">本文 (Markdown)</label>
      <UiTextarea id="edit-content" v-model="content" rows="20" class="font-mono" />
    </div>
    <p v-if="errorMessage" class="text-sm text-destructive">
      {{ errorMessage }}
    </p>
    <div class="flex justify-end gap-2">
      <UiButton :disabled="saving" @click="save">
        保存
      </UiButton>
    </div>
  </div>
</template>
