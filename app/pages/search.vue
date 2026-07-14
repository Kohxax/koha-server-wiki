<script setup lang="ts">
interface SearchResult {
  path: string
  title: string
  excerpt: string
}

const route = useRoute()
const q = computed(() => (route.query.q as string | undefined) ?? "")

const { data: results, status } = await useFetch<SearchResult[]>("/api/search", {
  key: () => `search:${q.value}`,
  query: { q },
})

function linkTo(path: string) {
  return path === "home" ? "/" : `/wiki/${path}`
}
</script>

<template>
  <div class="mx-auto max-w-2xl py-6">
    <h1 class="mb-4 text-xl font-semibold">
      検索: {{ q }}
    </h1>

    <div v-if="status === 'pending'" class="space-y-2">
      <UiSkeleton class="h-6 w-full" />
      <UiSkeleton class="h-6 w-full" />
    </div>

    <ul v-else-if="results && results.length > 0" class="space-y-4">
      <li v-for="result in results" :key="result.path">
        <NuxtLink :to="linkTo(result.path)" class="text-lg font-medium hover:underline">
          {{ result.title }}
        </NuxtLink>
        <p class="text-sm text-muted-foreground">
          {{ result.excerpt }}
        </p>
      </li>
    </ul>

    <p v-else class="text-sm text-muted-foreground">
      該当するページが見つかりませんでした
    </p>
  </div>
</template>
