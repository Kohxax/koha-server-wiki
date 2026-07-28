<script setup lang="ts">
import type { SidebarDto } from '~~/shared/types/api'

defineProps<{ open: boolean }>()
defineEmits<{ toggle: [] }>()

const { data: sidebar } = await useFetch<SidebarDto>('/api/sidebar', { key: 'sidebar' })
</script>

<template>
  <AppShellSidebar :open="open" sticky @toggle="$emit('toggle')">
    <SidebarTree v-if="sidebar?.tree.length" :nodes="sidebar.tree" />
    <p v-else class="text-sm text-muted-foreground">
      ページがまだありません
    </p>
  </AppShellSidebar>
</template>
