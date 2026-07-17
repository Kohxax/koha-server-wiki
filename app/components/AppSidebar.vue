<script setup lang="ts">
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SettingsIcon } from '@lucide/vue'
import type { TreeNode } from '~~/server/utils/tree'

interface SidebarResponse {
  tree: TreeNode[]
}

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const { user } = useUserSession()
const { data: sidebar } = await useFetch<SidebarResponse>('/api/sidebar', { key: 'sidebar' })
const canEdit = computed(() => user.value?.role === 'editor' || user.value?.role === 'admin')
</script>

<template>
    <button
      v-if="props.open"
      class="fixed inset-0 z-40 bg-foreground/20 md:hidden"
      aria-label="サイドバーを閉じる"
      @click="emit('toggle')"
    />
    <aside
      class="app-sidebar fixed top-14 bottom-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden border-r bg-background transition-transform duration-300 ease-out md:relative md:top-auto md:z-auto md:translate-x-0 md:bg-muted/20"
      :class="props.open ? 'translate-x-0 md:w-64' : '-translate-x-full md:w-0'"
    >
      <div class="flex w-64 shrink-0 justify-end border-b p-2">
        <UiButton variant="ghost" size="icon-sm" :aria-label="props.open ? 'サイドバーを閉じる' : 'サイドバーを開く'" @click="emit('toggle')">
          <PanelLeftCloseIcon v-if="props.open" />
          <PanelLeftOpenIcon v-else />
        </UiButton>
      </div>
      <UiScrollArea class="min-h-0 w-64 flex-1 p-4">
        <SidebarTree v-if="sidebar?.tree.length" :nodes="sidebar.tree" />
        <p v-else class="text-sm text-muted-foreground">
          ページがまだありません
        </p>
      </UiScrollArea>
      <NuxtLink v-if="canEdit" to="/admin/sidebar" class="w-64 border-t p-2">
        <UiButton variant="ghost" size="sm" class="w-full justify-start" title="サイドバー設定">
          <SettingsIcon />
          サイドバー設定
        </UiButton>
      </NuxtLink>
    </aside>
    <UiButton
      v-if="!props.open"
      class="fixed bottom-5 left-5 z-40 shadow-md md:top-16 md:bottom-auto"
      variant="outline"
      size="icon"
      aria-label="メニューを開く"
      @click="emit('toggle')"
    >
      <MenuIcon />
    </UiButton>
</template>
