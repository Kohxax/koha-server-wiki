<script setup lang="ts">
import { PlusIcon } from "@lucide/vue"
import type { TreeNode } from "~~/server/utils/tree"

definePageMeta({ middleware: ["require-editor"] })

interface ManagedPage {
  label: string
  path: string
}

const { data: tree, refresh } = await useFetch<TreeNode[]>("/api/pages/tree", { key: "settings-pages" })
const deletingPath = ref<string | null>(null)
const pageToDelete = ref<ManagedPage | null>(null)

function requestRemove(page: ManagedPage) {
  pageToDelete.value = page
}

async function remove() {
  const page = pageToDelete.value
  if (!page)
    return

  pageToDelete.value = null
  deletingPath.value = page.path
  try {
    await $fetch(`/api/pages/${page.path}`, { method: "DELETE" as never })
    await Promise.all([refresh(), refreshNuxtData("sidebar"), refreshNuxtData("settings-summary")])
  } finally {
    deletingPath.value = null
  }
}

useHead({ title: "ページ管理" })
</script>

<template>
  <div class="mx-auto max-w-5xl py-2 sm:py-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">ページ管理</h1>
        <p class="mt-1 text-sm text-muted-foreground">Wikiページの閲覧、編集、削除を行えます。</p>
      </div>
      <NuxtLink to="/new">
        <UiButton><PlusIcon />新規ページ</UiButton>
      </NuxtLink>
    </div>

    <UiCard>
      <UiCardContent class="p-0">
        <PageManagementTree v-if="tree?.length" :nodes="tree" :deleting-path="deletingPath" @remove="requestRemove" />
        <p v-else class="p-4 text-sm text-muted-foreground">まだページがありません</p>
      </UiCardContent>
    </UiCard>
    <ConfirmDialog
      :open="!!pageToDelete"
      title="ページを削除しますか？"
      :description="pageToDelete ? `「${pageToDelete.label}」と編集履歴は元に戻せません。` : ''"
      confirm-label="削除"
      destructive
      @confirm="remove"
      @cancel="pageToDelete = null"
    />
  </div>
</template>
