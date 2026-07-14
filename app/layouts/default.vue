<script setup lang="ts">
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <NuxtLink to="/" class="font-semibold">
        こは鯖wiki
      </NuxtLink>
      <div class="flex-1" />
      <UiButton variant="ghost" size="icon" aria-label="テーマ切替" @click="toggleColorMode">
        <span v-if="colorMode.value === 'dark'">🌙</span>
        <span v-else>☀️</span>
      </UiButton>
      <UiAvatar>
        <UiAvatarFallback>?</UiAvatarFallback>
      </UiAvatar>
    </header>
    <div class="flex flex-1">
      <aside class="hidden w-64 shrink-0 border-r md:block">
        <UiScrollArea class="h-[calc(100vh-3.5rem)] p-4">
          <p class="text-sm text-muted-foreground">サイドバー(準備中)</p>
        </UiScrollArea>
      </aside>
      <main class="min-w-0 flex-1 p-6">
        <div class="prose dark:prose-invert max-w-none">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
