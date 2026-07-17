<script setup lang="ts">
const sidebarOpen = useState("settings-sidebar-open", () => true)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <div class="flex flex-1">
      <SettingsSidebar :open="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" />
      <main class="min-w-0 flex-1 bg-background p-4 sm:p-6">
        <div class="page-content">
          <slot />
        </div>
      </main>
    </div>
    <ScrollToTop />
  </div>
</template>
