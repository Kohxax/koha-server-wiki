<script setup lang="ts">
const sidebarOpen = useState('sidebar-open', () => true)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader :sidebar-open="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
    <div class="flex flex-1">
      <AppSidebar v-if="sidebarOpen" />
      <main class="min-w-0 flex-1 p-6">
        <div class="page-content">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
