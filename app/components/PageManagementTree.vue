<script setup lang="ts">
import {
  ChevronDownIcon, ExternalLinkIcon, FileIcon, FilePenLineIcon, FolderIcon, Trash2Icon,
} from "@lucide/vue"
import type { TreeNode } from "~~/server/utils/tree"

const props = withDefaults(defineProps<{
  nodes: TreeNode[]
  parentKey?: string
  deletingPath?: string | null
}>(), {
  parentKey: "",
  deletingPath: null,
})

const emit = defineEmits<{
  remove: [page: { label: string, path: string }]
}>()

const expanded = ref<Record<string, boolean>>({})

function nodeKey(node: TreeNode) {
  return `${props.parentKey}/${node.path ?? node.label}`
}

function isExpanded(node: TreeNode) {
  return expanded.value[nodeKey(node)] !== false
}

function toggleExpanded(node: TreeNode) {
  const key = nodeKey(node)
  expanded.value[key] = !isExpanded(node)
}

function pageUrl(path: string) {
  return path === "home" ? "/" : `/wiki/${path}`
}
</script>

<template>
  <ul class="divide-y">
    <li v-for="node in nodes" :key="nodeKey(node)">
      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3 sm:p-4">
        <div class="flex min-w-0 items-center gap-2">
          <UiButton
            v-if="node.children.length"
            type="button"
            variant="ghost"
            size="icon-sm"
            class="shrink-0"
            :aria-label="`${node.label}を${isExpanded(node) ? '折りたたむ' : '展開する'}`"
            @click="toggleExpanded(node)"
          >
            <ChevronDownIcon class="transition-transform" :class="{ '-rotate-90': !isExpanded(node) }" />
          </UiButton>
          <span v-else class="grid size-8 shrink-0 place-items-center">
            <FileIcon class="size-4 text-muted-foreground" />
          </span>
          <FolderIcon v-if="node.children.length" class="size-4 shrink-0 text-muted-foreground" />
          <div class="min-w-0">
            <p class="truncate font-medium">{{ node.label }}</p>
            <p v-if="node.path" class="truncate font-mono text-xs text-muted-foreground">{{ node.path }}</p>
            <p v-else class="text-xs text-muted-foreground">フォルダ</p>
          </div>
        </div>
        <div v-if="node.path" class="flex shrink-0 items-center gap-1">
          <NuxtLink :to="pageUrl(node.path)">
            <UiButton variant="ghost" size="icon-sm" :aria-label="`${node.label}を閲覧`" title="閲覧"><ExternalLinkIcon /></UiButton>
          </NuxtLink>
          <NuxtLink :to="`/edit/${node.path}`">
            <UiButton variant="ghost" size="icon-sm" :aria-label="`${node.label}を編集`" title="編集"><FilePenLineIcon /></UiButton>
          </NuxtLink>
          <UiButton variant="ghost" size="icon-sm" :disabled="deletingPath === node.path" :aria-label="`${node.label}を削除`" title="削除" @click="emit('remove', { label: node.label, path: node.path })">
            <Trash2Icon class="text-destructive" />
          </UiButton>
        </div>
        <span v-else class="size-8" aria-hidden="true" />
      </div>
      <PageManagementTree
        v-if="node.children.length && isExpanded(node)"
        :nodes="node.children"
        :parent-key="nodeKey(node)"
        :deleting-path="deletingPath"
        class="ml-5 border-l"
        @remove="emit('remove', $event)"
      />
    </li>
  </ul>
</template>
