<script setup lang="ts">
const sidebarOpen = useState('sidebar-open', () => true)
const sidebarReady = ref(false)

onMounted(() => {
  if (window.matchMedia('(max-width: 767px)').matches)
    sidebarOpen.value = false
  sidebarReady.value = true
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <div class="flex flex-1">
      <AppSidebar :open="sidebarOpen" :ready="sidebarReady" @toggle="sidebarOpen = !sidebarOpen" />
      <main class="min-w-0 flex-1 bg-background p-4 sm:p-6">
        <div class="page-content">
          <slot />
        </div>
      </main>
    </div>
    <ScrollToTop />
  </div>
</template>
