<script setup lang="ts">
import { SettingsIcon } from '@lucide/vue'
import type { TreeNode } from '~~/server/utils/tree'

interface SidebarResponse {
  tree: TreeNode[]
}

const { user } = useUserSession()
const { data: sidebar } = await useFetch<SidebarResponse>('/api/sidebar', { key: 'sidebar' })
const canEdit = computed(() => user.value?.role === 'editor' || user.value?.role === 'admin')
</script>

<template>
  <aside class="hidden w-64 shrink-0 flex-col border-r bg-muted/20 md:flex">
    <UiScrollArea class="min-h-0 flex-1 p-4">
      <SidebarTree v-if="sidebar?.tree.length" :nodes="sidebar.tree" />
      <p v-else class="text-sm text-muted-foreground">
        ページがまだありません
      </p>
    </UiScrollArea>
    <NuxtLink v-if="canEdit" to="/admin/sidebar" class="border-t p-2">
      <UiButton variant="ghost" size="sm" class="w-full justify-start" title="サイドバー設定">
        <SettingsIcon />
        サイドバー設定
      </UiButton>
    </NuxtLink>
  </aside>
</template>
