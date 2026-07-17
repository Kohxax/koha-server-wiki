<script setup lang="ts">
import {
  FolderCogIcon, ImageIcon, LayoutDashboardIcon, MenuIcon, PanelLeftCloseIcon,
  PanelLeftOpenIcon, UsersIcon, WaypointsIcon,
} from "@lucide/vue"
import type { Component } from "vue"
import { visibleSettingsMenu, type SettingsIcon } from "~/lib/settings-menu"

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const route = useRoute()
const { user } = useUserSession()
const menu = computed(() => visibleSettingsMenu(user.value?.role))

const icons: Record<SettingsIcon, Component> = {
  dashboard: LayoutDashboardIcon,
  pages: WaypointsIcon,
  sidebar: FolderCogIcon,
  media: ImageIcon,
  users: UsersIcon,
}

function isActive(to: string) {
  return to === "/settings" ? route.path === to : route.path.startsWith(`${to}/`) || route.path === to
}
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
      <p class="mb-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground">設定</p>
      <nav aria-label="設定メニュー" class="space-y-1">
        <NuxtLink
          v-for="item in menu"
          :key="item.id"
          :to="item.to"
          class="flex items-center gap-2 border-l-2 border-transparent px-2 py-2 text-sm hover:bg-muted"
          :class="isActive(item.to) ? 'border-primary bg-primary/10 font-medium text-primary' : ''"
        >
          <component :is="icons[item.icon]" class="size-4 shrink-0" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
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
