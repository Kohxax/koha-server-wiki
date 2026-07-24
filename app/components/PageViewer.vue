<script setup lang="ts">
import ogImage from "~/assets/images/face.webp?url&no-inline"
import grassBlockUrl from "~/assets/images/grassblock.webp?url&no-inline"
import type { LinkPreviewDto, PageDetailDto } from "~~/shared/types/api"
import { internalPagePathFromHref, isHttpsHref } from "~~/shared/utils/link-preview"
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
const linkPreview = shallowRef<LinkPreviewDto>()
const linkPreviewOpen = ref(false)
const linkPreviewPosition = ref({ left: 0, top: 0 })
const previewCache = new Map<string, LinkPreviewDto>()
const pendingPreviewRequests = new Map<string, Promise<LinkPreviewDto>>()
let hoveredHref = ""
let previewOpenTimer: ReturnType<typeof setTimeout> | undefined
let previewCloseTimer: ReturnType<typeof setTimeout> | undefined

function isPreviewableHref(href: string) {
  return internalPagePathFromHref(href) !== null || isHttpsHref(href)
}

async function getLinkPreview(href: string): Promise<LinkPreviewDto> {
  const cached = previewCache.get(href)
  if (cached)
    return cached
  const pending = pendingPreviewRequests.get(href)
  if (pending)
    return await pending

  const request = $fetch<LinkPreviewDto>("/api/link-preview", { query: { href } })
  pendingPreviewRequests.set(href, request)
  try {
    const result = await request
    previewCache.set(href, result)
    return result
  } finally {
    pendingPreviewRequests.delete(href)
  }
}

function positionLinkPreview(link: HTMLAnchorElement) {
  const rect = link.getBoundingClientRect()
  linkPreviewPosition.value = {
    left: Math.max(8, Math.min(rect.left, window.innerWidth - 336)),
    top: Math.min(rect.bottom + 8, window.innerHeight - 16),
  }
}

function showLinkPreview(event: Event) {
  const target = event.target
  if (!(target instanceof Element))
    return
  const link = target.closest<HTMLAnchorElement>("a[href]")
  const href = link?.getAttribute("href")
  if (!link || !href || !isPreviewableHref(href))
    return

  clearTimeout(previewCloseTimer)
  positionLinkPreview(link)
  if (linkPreviewOpen.value && hoveredHref === href)
    return

  clearTimeout(previewOpenTimer)
  hoveredHref = href
  linkPreview.value = undefined
  previewOpenTimer = setTimeout(() => {
    linkPreviewOpen.value = true
    void getLinkPreview(href)
      .then((value) => {
        if (hoveredHref === href)
          linkPreview.value = value
      })
      .catch(() => {
        if (hoveredHref === href)
          linkPreviewOpen.value = false
      })
  }, 180)
}

function hideLinkPreview() {
  clearTimeout(previewOpenTimer)
  previewCloseTimer = setTimeout(() => {
    linkPreviewOpen.value = false
    linkPreview.value = undefined
  }, 120)
}

function hideLinkPreviewOnFocusLeave() {
  setTimeout(() => {
    if (!document.activeElement?.closest("article[data-image-viewer-group]"))
      hideLinkPreview()
  })
}

function useFallbackPreviewImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  image.onerror = null
  image.src = grassBlockUrl
}

function formatPreviewUpdatedAt(value: string | null): string | null {
  return value ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value)) : null
}

onBeforeUnmount(() => {
  clearTimeout(previewOpenTimer)
  clearTimeout(previewCloseTimer)
})

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
          <UiButton v-if="canEdit" variant="outline" size="sm" class="bg-sidebar hover:bg-sidebar-accent lg:hidden" as-child>
            <NuxtLink :to="`/edit/${path}`">編集</NuxtLink>
          </UiButton>
        </div>
        <p v-if="page.description" class="mt-2 text-sm leading-6 text-muted-foreground">{{ page.description }}</p>
      </div>
      <article data-image-viewer-group class="min-w-0 lg:col-start-1 lg:row-start-2" @mouseover="showLinkPreview" @mouseleave="hideLinkPreview" @focusin="showLinkPreview" @focusout="hideLinkPreviewOnFocusLeave">
        <MDCRenderer :body="body" :data="data" class="wiki-prose [&_img]:h-auto [&_img]:max-w-full" />
      </article>
      <div
        v-if="linkPreviewOpen"
        role="tooltip"
        class="pointer-events-none fixed z-30 w-80 overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg"
        :style="{ left: `${linkPreviewPosition.left}px`, top: `${linkPreviewPosition.top}px` }"
      >
        <div v-if="!linkPreview" class="space-y-3 p-3">
          <UiSkeleton class="h-28 w-full" />
          <UiSkeleton class="h-4 w-2/3" />
          <UiSkeleton class="h-3 w-full" />
        </div>
        <template v-else>
          <img :src="linkPreview.imageUrl ?? grassBlockUrl" :alt="`${linkPreview.title} のプレビュー画像`" class="h-28 w-full border-b border-border object-cover" loading="lazy" referrerpolicy="no-referrer" @error="useFallbackPreviewImage">
          <div class="space-y-1.5 p-3">
            <p class="line-clamp-2 text-sm font-semibold leading-5">{{ linkPreview.title }}</p>
            <p v-if="linkPreview.description" class="line-clamp-3 text-xs leading-5 text-muted-foreground">{{ linkPreview.description }}</p>
            <p v-if="linkPreview.siteName || formatPreviewUpdatedAt(linkPreview.updatedAt)" class="text-xs text-muted-foreground">
              {{ linkPreview.siteName ?? formatPreviewUpdatedAt(linkPreview.updatedAt) }}
            </p>
          </div>
        </template>
      </div>
      <PageRightSidebar
        :can-edit="canEdit"
        :edit-to="`/edit/${path}`"
        :toc="toc?.links ?? []"
        :updated-by-username="page.updatedByUsername"
        :updated-at="updatedAt"
        @select-heading="scrollToHeading"
      />
    </div>
  </MDC>
</template>
