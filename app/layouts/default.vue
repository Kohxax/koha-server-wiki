<script setup lang="ts">
const colorMode = useColorMode()
const { loggedIn, user, clear } = useUserSession()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

async function logout() {
  await clear()
  await navigateTo('/')
}

const { data: sidebar } = await useFetch('/api/sidebar', { key: 'sidebar' })

const searchQuery = ref('')
function submitSearch() {
  const q = searchQuery.value.trim()
  if (q)
    navigateTo(`/search?q=${encodeURIComponent(q)}`)
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
      <NuxtLink v-if="!loggedIn" to="/login">
        <UiButton variant="outline" size="sm">
          ログイン
        </UiButton>
      </NuxtLink>
      <UiDropdownMenu v-else>
        <UiDropdownMenuTrigger as-child>
          <button type="button" class="flex items-center gap-2" aria-label="ユーザーメニュー">
            <UiAvatar>
              <UiAvatarImage v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user?.username" />
              <UiAvatarFallback>{{ user?.username?.slice(0, 1).toUpperCase() }}</UiAvatarFallback>
            </UiAvatar>
          </button>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="end">
          <UiDropdownMenuLabel>
            {{ user?.username }} ({{ user?.role }})
          </UiDropdownMenuLabel>
          <UiDropdownMenuSeparator />
          <UiDropdownMenuItem @click="logout">
            ログアウト
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </header>
    <div class="flex flex-1">
      <aside class="hidden w-64 shrink-0 border-r md:block">
        <UiScrollArea class="h-[calc(100vh-3.5rem)] p-4">
          <UiInput
            v-model="searchQuery"
            type="search"
            placeholder="検索..."
            class="mb-4"
            @keyup.enter="submitSearch"
          />
          <SidebarTree v-if="sidebar?.tree.length" :nodes="sidebar.tree" />
          <p v-else class="text-sm text-muted-foreground">
            ページがまだありません
          </p>
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
