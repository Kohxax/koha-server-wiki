<script setup lang="ts">
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from '@lucide/vue'
import type { SidebarDto } from '~~/shared/types/api'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const { data: sidebar } = await useFetch<SidebarDto>('/api/sidebar', { key: 'sidebar' })
</script>

<template>
    <button
      v-if="props.open"
      class="fixed inset-0 z-40 bg-foreground/20 md:hidden"
      aria-label="サイドバーを閉じる"
      @click="emit('toggle')"
    />
    <aside
      class="app-shell app-sidebar fixed top-14 bottom-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out md:relative md:top-auto md:z-auto md:translate-x-0 md:transition-[width]"
      :class="props.open ? 'translate-x-0 md:w-64' : '-translate-x-full md:w-12'"
    >
      <div class="flex shrink-0 border-b p-2" :class="props.open ? 'w-64 justify-end' : 'w-12 justify-center'">
        <UiButton variant="ghost" size="icon-sm" :aria-label="props.open ? 'サイドバーを閉じる' : 'サイドバーを開く'" @click="emit('toggle')">
          <PanelLeftCloseIcon v-if="props.open" />
          <PanelLeftOpenIcon v-else />
        </UiButton>
      </div>
      <UiScrollArea v-show="props.open" class="min-h-0 w-64 flex-1 p-4">
        <SidebarTree v-if="sidebar?.tree.length" :nodes="sidebar.tree" />
        <p v-else class="text-sm text-muted-foreground">
          ページがまだありません
        </p>
      </UiScrollArea>
    </aside>
    <UiButton
      v-if="!props.open"
      class="fixed bottom-5 left-5 z-40 shadow-md md:hidden"
      variant="outline"
      size="icon"
      aria-label="メニューを開く"
      @click="emit('toggle')"
    >
      <MenuIcon />
    </UiButton>
</template>
