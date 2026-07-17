<script setup lang="ts">
import { MoonIcon, PlusIcon, SearchIcon, SettingsIcon, SunIcon } from '@lucide/vue'
import { onClickOutside, watchDebounced } from '@vueuse/core'

interface SearchResult {
  path: string
  title: string
  excerpt: string
}

const colorMode = useColorMode()
const { loggedIn, user, clear } = useUserSession()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => { colorMode.preference = value ? 'dark' : 'light' },
})

const canEdit = computed(() => user.value?.role === 'editor' || user.value?.role === 'admin')
const searchQuery = ref('')
const suggestions = ref<SearchResult[]>([])
const suggestionsStatus = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const suggestionsDismissed = ref(false)
const selectedSuggestion = ref(-1)
const searchContainer = ref<HTMLElement>()
let searchRequestId = 0

const showSuggestions = computed(() => !suggestionsDismissed.value && searchQuery.value.trim().length > 0)

function linkTo(path: string) {
  return path === 'home' ? '/' : `/wiki/${path}`
}

function closeSuggestions() {
  suggestionsDismissed.value = true
  selectedSuggestion.value = -1
}

onClickOutside(searchContainer, closeSuggestions)

watchDebounced(searchQuery, async (value) => {
  const q = value.trim()
  const requestId = ++searchRequestId
  selectedSuggestion.value = -1

  if (!q) {
    suggestions.value = []
    suggestionsStatus.value = 'idle'
    return
  }

  suggestionsStatus.value = 'pending'
  try {
    const results = await $fetch<SearchResult[]>('/api/search', { query: { q, limit: 5 } })
    if (requestId === searchRequestId)
      suggestions.value = results
    if (requestId === searchRequestId)
      suggestionsStatus.value = 'success'
  }
  catch {
    if (requestId === searchRequestId) {
      suggestions.value = []
      suggestionsStatus.value = 'error'
    }
  }
}, { debounce: 250 })

async function logout() {
  await clear()
  await navigateTo('/')
}

function submitSearch() {
  const q = searchQuery.value.trim()
  if (q) {
    closeSuggestions()
    navigateTo(`/search?q=${encodeURIComponent(q)}`)
  }
}

function selectSuggestion(result: SearchResult) {
  closeSuggestions()
  navigateTo(linkTo(result.path))
}

function handleSearchKeydown(event: KeyboardEvent) {
  if (!showSuggestions.value)
    return

  if (event.key === 'Escape') {
    closeSuggestions()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const result = suggestions.value[selectedSuggestion.value]
    if (result)
      selectSuggestion(result)
    else
      submitSearch()
    return
  }

  if (!suggestions.value.length)
    return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedSuggestion.value = (selectedSuggestion.value + 1) % suggestions.value.length
  }
  else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedSuggestion.value = selectedSuggestion.value < 0
      ? suggestions.value.length - 1
      : (selectedSuggestion.value - 1 + suggestions.value.length) % suggestions.value.length
  }
}
</script>

<template>
  <header class="app-shell grass-header sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-sidebar-border px-2 text-sidebar-foreground sm:gap-4 sm:px-4">
    <NuxtLink to="/" class="grass-header__brand flex shrink-0 items-center gap-2 font-semibold">
      <img src="~/assets/images/face.webp" alt="" class="size-8 object-contain" width="32" height="32">
      <span class="hidden sm:inline">こは鯖wiki</span>
    </NuxtLink>
    <div class="flex min-w-0 flex-1 justify-center px-1 sm:px-4">
      <div ref="searchContainer" class="relative w-full max-w-md">
        <SearchIcon class="pointer-events-none absolute z-10 top-1/2 left-2.5 size-4 -translate-y-1/2 !text-white" />
        <UiInput
          v-model="searchQuery"
          type="search"
          placeholder="検索..."
          class="pl-8 !border-black/50 !bg-[#1c1c1c] !text-white placeholder:!text-white/70 hover:!bg-[#292929] focus-visible:!border-primary focus-visible:!bg-[#292929]"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          :aria-expanded="showSuggestions"
          @focus="suggestionsDismissed = false"
          @input="suggestionsDismissed = false"
          @keydown="handleSearchKeydown"
        />
        <div
          v-if="showSuggestions"
          id="search-suggestions"
          role="listbox"
          class="supports-backdrop-filter:backdrop-blur-xs absolute z-50 mt-1 w-full border border-border bg-popover/95 text-popover-foreground shadow-md"
        >
          <div v-if="suggestionsStatus === 'pending'" class="px-3 py-2 text-xs text-muted-foreground">検索中...</div>
          <template v-else-if="suggestionsStatus === 'success' && suggestions.length">
            <button
              v-for="(result, index) in suggestions"
              :key="result.path"
              type="button"
              role="option"
              :aria-selected="selectedSuggestion === index"
              class="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-accent focus:bg-accent focus:outline-none"
              :class="{ 'bg-accent': selectedSuggestion === index }"
              @mousedown.prevent="selectSuggestion(result)"
            >
              <span class="text-sm font-medium">{{ result.title }}</span>
              <span class="font-mono text-xs text-muted-foreground">{{ linkTo(result.path) }}</span>
              <span v-if="result.excerpt" class="line-clamp-2 text-xs text-muted-foreground">{{ result.excerpt }}</span>
            </button>
          </template>
          <p v-else-if="suggestionsStatus === 'success'" class="px-3 py-2 text-xs text-muted-foreground">該当するページが見つかりませんでした</p>
          <p v-else-if="suggestionsStatus === 'error'" class="px-3 py-2 text-xs text-muted-foreground">候補を取得できませんでした</p>
        </div>
      </div>
    </div>
    <NuxtLink v-if="canEdit" to="/new">
      <UiButton variant="outline" size="sm" class="!border-black/50 !bg-[#1c1c1c] !text-white hover:!bg-[#292929] hover:!text-white">
        <PlusIcon />
        <span class="hidden sm:inline">新規作成</span>
      </UiButton>
    </NuxtLink>
    <NuxtLink v-if="canEdit" to="/settings">
        <UiButton variant="ghost" size="icon" aria-label="管理メニュー" class="!text-white hover:!bg-white/[0.16] hover:!text-white">
          <SettingsIcon />
        </UiButton>
    </NuxtLink>
    <div class="flex items-center gap-1.5">
      <SunIcon class="size-4 !text-white/70" />
      <UiSwitch
        v-if="!colorMode.unknown"
        v-model="isDark"
        aria-label="テーマ切替"
        class="data-unchecked:!bg-white/30 data-checked:!bg-white/50 [&_[data-slot=switch-thumb]]:!bg-white"
      />
      <span v-else class="block h-[18.4px] w-8" aria-hidden="true" />
      <MoonIcon class="size-4 !text-white/70" />
    </div>
    <NuxtLink v-if="!loggedIn" to="/login">
      <UiButton variant="outline" size="sm" class="!border-black/50 !bg-[#1c1c1c] !text-white hover:!bg-[#292929] hover:!text-white">ログイン</UiButton>
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
      <UiDropdownMenuContent align="end" class="grass-header-menu">
        <UiDropdownMenuLabel>{{ user?.username }} ({{ user?.role }})</UiDropdownMenuLabel>
        <UiDropdownMenuSeparator />
        <UiDropdownMenuItem @click="logout">ログアウト</UiDropdownMenuItem>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </header>
</template>
