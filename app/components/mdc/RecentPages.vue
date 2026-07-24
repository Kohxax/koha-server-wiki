<script setup lang="ts">
import type { RecentPageDto } from "~~/shared/types/api"
import { wikiPageUrl } from "~~/shared/utils/wiki-url"

const props = defineProps<{ limit?: string | number }>()

const limit = computed(() => {
  const value = Number(props.limit ?? 5)
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : 5
})
const endpoint = computed(() => `/api/pages/recent?limit=${limit.value}`)
const { data: pages, status, error, refresh } = await useFetch<RecentPageDto[]>(endpoint, {
  key: () => `recent-pages:${limit.value}`,
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}
</script>

<template>
  <section class="my-6" aria-labelledby="recent-pages-heading">
    <h2 id="recent-pages-heading" class="mb-3 text-lg font-semibold">最近更新されたページ</h2>
    <UiCard>
      <UiCardContent v-if="status === 'pending'" class="space-y-3 p-4">
        <UiSkeleton class="h-5 w-1/2" />
        <UiSkeleton class="h-5 w-2/3" />
      </UiCardContent>
      <UiCardContent v-else-if="error" class="p-4 text-sm text-muted-foreground">
        <p>最近更新されたページを読み込めませんでした。</p>
        <UiButton class="mt-3" size="sm" variant="outline" @click="refresh">再試行</UiButton>
      </UiCardContent>
      <UiCardContent v-else-if="pages?.length" class="p-0">
        <ul class="divide-y">
          <li v-for="page in pages" :key="page.path" class="flex flex-wrap items-center justify-between gap-2 p-4">
            <NuxtLink :to="wikiPageUrl(page.path)" class="font-medium hover:underline">{{ page.title }}</NuxtLink>
            <time :datetime="page.updatedAt" class="text-xs text-muted-foreground">{{ formatDate(page.updatedAt) }}</time>
          </li>
        </ul>
      </UiCardContent>
      <UiCardContent v-else class="p-4 text-sm text-muted-foreground">まだページがありません</UiCardContent>
    </UiCard>
  </section>
</template>
