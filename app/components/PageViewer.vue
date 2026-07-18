<script setup lang="ts">
import { HistoryIcon } from "@lucide/vue"
import ogImage from "~/assets/images/face.webp?url&no-inline"
import type { PageDetailDto } from "~~/shared/types/api"
import { wikiPageUrl } from "~~/shared/utils/wiki-url"

const props = defineProps<{ path: string }>()
const { user } = useUserSession()

const { data: page, status, error } = await useFetch<PageDetailDto>(() => `/api/pages/${props.path}`, {
  key: () => `page:${props.path}`,
})

const canEdit = computed(() => user.value?.role === "editor" || user.value?.role === "admin")
const notFound = computed(() => error.value?.statusCode === 404)
const updatedAt = computed(() => page.value?.updatedAt ? new Date(page.value.updatedAt).toLocaleString("ja-JP") : "")
const runtimeConfig = useRuntimeConfig()
const requestUrl = useRequestURL()
const siteOrigin = computed(() => (runtimeConfig.public.siteUrl || requestUrl.origin).replace(/\/$/, ""))
const pageTitle = computed(() => page.value?.title ?? props.path)
const pageDescription = computed(() => page.value?.description || "こは鯖の情報をまとめたMinecraftサーバーWiki")
const canonicalUrl = computed(() => new URL(wikiPageUrl(page.value?.path ?? props.path), `${siteOrigin.value}/`).href)
const ogImageUrl = computed(() => new URL(ogImage, `${siteOrigin.value}/`).href)

function scrollToHeading(id: string) {
  const target = document.getElementById(id)
  if (!target)
    return
  target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })
  window.history.replaceState(null, "", `#${encodeURIComponent(id)}`)
}

useSeoMeta({
  title: pageTitle,
  description: pageDescription,
  ogTitle: pageTitle,
  ogDescription: pageDescription,
  ogType: "article",
  ogUrl: canonicalUrl,
  ogImage: ogImageUrl,
  ogImageAlt: "こは鯖wiki",
  twitterCard: "summary",
  twitterTitle: pageTitle,
  twitterDescription: pageDescription,
  twitterImage: ogImageUrl,
  twitterImageAlt: "こは鯖wiki",
})
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
  <MDC v-else-if="page" :key="`${page.path}:${page.updatedAt}`" :cache-key="`page-mdc:${page.path}:${page.updatedAt}`" :value="page.content" :parser-options="{ toc: { depth: 5 } }" :partial="false" v-slot="{ body, data, toc }">
    <div v-if="body" class="mx-auto grid max-w-7xl gap-x-8 gap-y-0 lg:grid-cols-[minmax(0,48rem)_14rem] lg:justify-center">
      <div class="mb-8 lg:col-span-2">
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-2xl font-bold">{{ page.title }}</h1>
          <UiButton v-if="canEdit" variant="outline" size="sm" class="bg-sidebar hover:bg-sidebar-accent" as-child>
            <NuxtLink :to="`/edit/${path}`">編集</NuxtLink>
          </UiButton>
        </div>
        <p v-if="page.description" class="mt-2 text-sm leading-6 text-muted-foreground">{{ page.description }}</p>
      </div>
      <article data-image-viewer-group class="order-1 min-w-0">
        <MDCRenderer :body="body" :data="data" class="wiki-prose [&_img]:h-auto [&_img]:max-w-full" />
      </article>
      <aside class="order-2 hidden self-start space-y-6 text-sm lg:sticky lg:top-20 lg:block">
        <section v-if="toc?.links?.length" class="wiki-scrollbar max-h-[calc(100dvh-12rem)] overflow-y-auto border border-sidebar-border bg-sidebar p-4 transition-colors dark:bg-muted/30">
          <h2 class="mb-3 font-semibold">目次</h2>
          <nav>
            <TocTree :entries="toc.links" @select="scrollToHeading" />
          </nav>
        </section>
        <section class="border border-sidebar-border bg-sidebar p-4 text-muted-foreground dark:bg-muted/30">
          <div class="flex items-start gap-2">
            <HistoryIcon class="mt-0.5 size-4 shrink-0" />
            <p>最終更新: {{ page.updatedByUsername ?? "不明" }}<br>（{{ updatedAt }}）</p>
          </div>
        </section>
      </aside>
    </div>
  </MDC>
</template>
