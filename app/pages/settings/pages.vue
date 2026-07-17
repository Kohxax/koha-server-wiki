<script setup lang="ts">
import { ExternalLinkIcon, FilePenLineIcon, PlusIcon, Trash2Icon } from "@lucide/vue"
import type { TreeNode } from "~~/server/utils/tree"

definePageMeta({ middleware: ["require-editor"] })

interface ManagedPage {
  label: string
  path: string
  level: number
}

const { data: tree, refresh } = await useFetch<TreeNode[]>("/api/pages/tree", { key: "settings-pages" })
const deletingPath = ref<string | null>(null)
const pageToDelete = ref<ManagedPage | null>(null)

const managedPages = computed(() => {
  const result: ManagedPage[] = []
  function walk(nodes: TreeNode[], level: number) {
    for (const node of nodes) {
      if (node.path)
        result.push({ label: node.label, path: node.path, level })
      walk(node.children, level + 1)
    }
  }
  walk(tree.value ?? [], 0)
  return result
})

function pageUrl(path: string) {
  return path === "home" ? "/" : `/wiki/${path}`
}

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
        <ul v-if="managedPages.length" class="divide-y">
          <li v-for="page in managedPages" :key="page.path" class="flex flex-wrap items-center gap-3 p-3 sm:p-4">
            <div class="min-w-0 flex-1" :style="{ paddingLeft: `${page.level * 1}rem` }">
              <p class="truncate font-medium">{{ page.label }}</p>
              <p class="truncate font-mono text-xs text-muted-foreground">{{ page.path }}</p>
            </div>
            <div class="flex items-center gap-1">
              <NuxtLink :to="pageUrl(page.path)">
                <UiButton variant="ghost" size="icon-sm" :aria-label="`${page.label}を閲覧`" title="閲覧"><ExternalLinkIcon /></UiButton>
              </NuxtLink>
              <NuxtLink :to="`/edit/${page.path}`">
                <UiButton variant="ghost" size="icon-sm" :aria-label="`${page.label}を編集`" title="編集"><FilePenLineIcon /></UiButton>
              </NuxtLink>
              <UiButton variant="ghost" size="icon-sm" :disabled="deletingPath === page.path" :aria-label="`${page.label}を削除`" title="削除" @click="requestRemove(page)">
                <Trash2Icon class="text-destructive" />
              </UiButton>
            </div>
          </li>
        </ul>
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
