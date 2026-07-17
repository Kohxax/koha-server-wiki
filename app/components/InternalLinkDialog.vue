<script setup lang="ts">
import type { TreeNode } from '~~/shared/types/api'
import { wikiPageUrl } from '~~/shared/utils/wiki-url'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ insert: [markdown: string] }>()
const query = ref('')
const { data: tree } = await useFetch<TreeNode[]>('/api/pages/tree', { key: 'editor-page-links' })

const pages = computed(() => {
  const result: { label: string, path: string }[] = []
  const walk = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.path)
        result.push({ label: node.label, path: node.path })
      walk(node.children)
    }
  }
  walk(tree.value ?? [])
  const normalizedQuery = query.value.trim().toLocaleLowerCase()
  return normalizedQuery
    ? result.filter(page => `${page.label} ${page.path}`.toLocaleLowerCase().includes(normalizedQuery))
    : result
})

function insertPage(page: { label: string, path: string }) {
  const href = wikiPageUrl(page.path)
  emit('insert', `[${page.label}](${href})`)
  open.value = false
  query.value = ''
}
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="max-w-lg">
      <UiDialogHeader>
        <UiDialogTitle>内部ページへのリンクを挿入</UiDialogTitle>
        <UiDialogDescription>ページ名またはパスで検索し、リンク先を選択します。</UiDialogDescription>
      </UiDialogHeader>
      <UiInput v-model="query" autofocus placeholder="ページ名またはパスを検索" aria-label="内部ページを検索" />
      <div class="max-h-72 overflow-y-auto border">
        <button v-for="page in pages" :key="page.path" type="button" class="flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left hover:bg-muted last:border-b-0" @click="insertPage(page)">
          <span class="font-medium">{{ page.label }}</span>
          <span class="font-mono text-xs text-muted-foreground">{{ wikiPageUrl(page.path) }}</span>
        </button>
        <p v-if="!pages.length" class="p-4 text-sm text-muted-foreground">該当するページがありません</p>
      </div>
    </UiDialogContent>
  </UiDialog>
</template>
