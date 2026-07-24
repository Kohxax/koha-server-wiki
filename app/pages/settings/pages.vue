<script setup lang="ts">
import { PlusIcon, SearchIcon } from "@lucide/vue"
import type { TreeNode } from "~~/shared/types/api"

definePageMeta({ middleware: ["require-editor"] })

interface ManagedPage {
  label: string
  path: string
}

const { data: tree, refresh } = await useFetch<TreeNode[]>("/api/pages/tree", { key: "settings-pages" })
const deletingPath = ref<string | null>(null)
const pageToDelete = ref<ManagedPage | null>(null)
const searchQuery = ref("")

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery)
    return nodes

  return nodes.flatMap((node) => {
    const children = filterTree(node.children, normalizedQuery)
    const matches = `${node.label} ${node.path ?? ""}`.toLocaleLowerCase().includes(normalizedQuery)
    return matches || children.length ? [{ ...node, children }] : []
  })
}

const filteredTree = computed(() => filterTree(tree.value ?? [], searchQuery.value))
const isFiltering = computed(() => searchQuery.value.trim().length > 0)

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

    <div class="relative mb-3 max-w-md">
      <SearchIcon class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <UiInput v-model="searchQuery" type="search" aria-label="ページを検索" placeholder="タイトル・パスで検索" class="pl-9" />
    </div>

    <UiCard>
      <UiCardContent class="p-0">
        <PageManagementTree v-if="filteredTree.length" :nodes="filteredTree" :deleting-path="deletingPath" :force-expanded="isFiltering" @remove="requestRemove" />
        <p v-else class="p-4 text-sm text-muted-foreground">{{ isFiltering ? "該当するページがありません" : "まだページがありません" }}</p>
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
