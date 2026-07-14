<script setup lang="ts">
import type { Page } from "~~/server/database/schema"

const props = defineProps<{ path: string }>()
const { user } = useUserSession()

const { data: page, status, error } = await useFetch<Page>(() => `/api/pages/${props.path}`, {
  key: () => `page:${props.path}`,
})

const canEdit = computed(() => user.value?.role === "editor" || user.value?.role === "admin")
const notFound = computed(() => error.value?.statusCode === 404)

useHead({ title: () => page.value?.title ?? props.path })
</script>

<template>
  <div v-if="status === 'pending'" class="space-y-4">
    <UiSkeleton class="h-8 w-1/3" />
    <UiSkeleton class="h-64 w-full" />
  </div>
  <div v-else-if="error" class="flex flex-col items-center gap-4 py-16 text-center">
    <template v-if="notFound">
      <p class="text-muted-foreground">
        このページはまだ存在しません。
      </p>
      <UiButton v-if="canEdit" as-child>
        <NuxtLink :to="`/edit/${path}`">
          作成する
        </NuxtLink>
      </UiButton>
    </template>
    <p v-else class="text-destructive">
      ページの読み込み中にエラーが発生しました。
    </p>
  </div>
  <article v-else-if="page">
    <div class="mb-4 flex items-center justify-between gap-4">
      <h1 class="text-2xl font-bold">
        {{ page.title }}
      </h1>
      <div class="flex gap-2">
        <UiButton variant="outline" size="sm" as-child>
          <NuxtLink :to="`/history/${path}`">
            履歴
          </NuxtLink>
        </UiButton>
        <UiButton v-if="canEdit" variant="outline" size="sm" as-child>
          <NuxtLink :to="`/edit/${path}`">
            編集
          </NuxtLink>
        </UiButton>
      </div>
    </div>
    <MDC :value="page.content" tag="div" />
  </article>
</template>
