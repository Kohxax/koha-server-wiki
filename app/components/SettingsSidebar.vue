<script setup lang="ts">
import { visibleSettingsMenu } from "~/lib/settings-menu"

defineProps<{ open: boolean }>()
defineEmits<{ toggle: [] }>()

const route = useRoute()
const { user } = useUserSession()
const menu = computed(() => visibleSettingsMenu(user.value?.role))

function isActive(to: string) {
  return to === "/settings" ? route.path === to : route.path.startsWith(`${to}/`) || route.path === to
}
</script>

<template>
  <AppShellSidebar :open="open" @toggle="$emit('toggle')">
    <p class="mb-3 px-2 text-xs font-semibold tracking-wide text-muted-foreground">設定</p>
    <nav aria-label="設定メニュー" class="space-y-1">
      <NuxtLink
        v-for="item in menu"
        :key="item.id"
        :to="item.to"
        class="flex items-center gap-2 border-l-2 border-transparent px-2 py-2 text-sm hover:bg-muted"
        :class="isActive(item.to) ? 'border-primary bg-primary/10 font-medium text-primary' : ''"
      >
        <component :is="item.icon" class="size-4 shrink-0" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </AppShellSidebar>
</template>
