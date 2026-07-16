<script setup lang="ts">
import { MoonIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon, SearchIcon, SettingsIcon, SunIcon } from '@lucide/vue'

const colorMode = useColorMode()
const { loggedIn, user, clear } = useUserSession()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => { colorMode.preference = value ? 'dark' : 'light' },
})

const canEdit = computed(() => user.value?.role === 'editor' || user.value?.role === 'admin')
const isAdmin = computed(() => user.value?.role === 'admin')

async function logout() {
  await clear()
  await navigateTo('/')
}

const { data: sidebar } = await useFetch('/api/sidebar', { key: 'sidebar' })
const sidebarOpen = useState('sidebar-open', () => true)

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
      <NuxtLink to="/" class="flex shrink-0 items-center gap-2 font-semibold text-primary">
        <img src="~/assets/images/face.webp" alt="" class="size-8 object-contain" width="32" height="32">
        <span>こは鯖wiki</span>
      </NuxtLink>
      <UiButton
        class="hidden md:inline-flex"
        variant="ghost"
        size="icon"
        :aria-label="sidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'"
        @click="sidebarOpen = !sidebarOpen"
      >
        <PanelLeftCloseIcon v-if="sidebarOpen" />
        <PanelLeftOpenIcon v-else />
      </UiButton>
      <div class="flex flex-1 justify-center px-4">
        <div class="relative w-full max-w-md">
          <SearchIcon class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <UiInput
            v-model="searchQuery"
            type="search"
            placeholder="検索..."
            class="pl-8"
            @keyup.enter="submitSearch"
          />
        </div>
      </div>
      <NuxtLink v-if="canEdit" to="/new">
        <UiButton variant="outline" size="sm">
          <PlusIcon />
          新規作成
        </UiButton>
      </NuxtLink>
      <UiDropdownMenu v-if="canEdit">
        <UiDropdownMenuTrigger as-child>
          <UiButton variant="ghost" size="icon" aria-label="管理メニュー">
            <SettingsIcon />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="end">
          <UiDropdownMenuItem as-child>
            <NuxtLink to="/admin/media">
              メディア管理
            </NuxtLink>
          </UiDropdownMenuItem>
          <UiDropdownMenuItem v-if="isAdmin" as-child>
            <NuxtLink to="/admin/users">
              ユーザー管理
            </NuxtLink>
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
      <div class="flex items-center gap-1.5">
        <SunIcon class="size-4 text-muted-foreground" />
        <UiSwitch v-if="!colorMode.unknown" v-model="isDark" aria-label="テーマ切替" />
        <span v-else class="block h-[18.4px] w-8" aria-hidden="true" />
        <MoonIcon class="size-4 text-muted-foreground" />
      </div>
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
      <aside v-if="sidebarOpen" class="hidden w-64 shrink-0 flex-col border-r bg-muted/20 md:flex">
        <UiScrollArea class="min-h-0 flex-1 p-4">
          <SidebarTree v-if="sidebar?.tree.length" :nodes="sidebar.tree" />
          <p v-else class="text-sm text-muted-foreground">
            ページがまだありません
          </p>
        </UiScrollArea>
        <NuxtLink v-if="canEdit" to="/admin/sidebar" class="border-t p-2">
          <UiButton variant="ghost" size="sm" class="w-full justify-start" title="サイドバー設定">
            <SettingsIcon />
            サイドバー設定
          </UiButton>
        </NuxtLink>
      </aside>
      <main class="min-w-0 flex-1 p-6">
        <div class="page-content">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
