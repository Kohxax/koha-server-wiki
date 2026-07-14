<script setup lang="ts">
definePageMeta({ middleware: ["require-editor"] })

const path = ref("")
const error = ref("")

function submit() {
  const trimmed = path.value.trim().replace(/^\/+/, "").replace(/\/+$/, "")
  if (!trimmed) {
    error.value = "パスを入力してください"
    return
  }
  navigateTo(`/edit/${trimmed}`)
}
</script>

<template>
  <div class="mx-auto max-w-md py-12">
    <h1 class="mb-6 text-xl font-semibold">
      新規ページ作成
    </h1>
    <div class="space-y-2">
      <label class="text-sm font-medium" for="new-page-path">パス</label>
      <UiInput id="new-page-path" v-model="path" placeholder="build/hogehoge" @keyup.enter="submit" />
      <p v-if="error" class="text-sm text-destructive">
        {{ error }}
      </p>
      <p class="text-sm text-muted-foreground">
        例: build/hogehoge
      </p>
    </div>
    <UiButton class="mt-4" @click="submit">
      次へ
    </UiButton>
  </div>
</template>
