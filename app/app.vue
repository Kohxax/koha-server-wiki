<script setup lang="ts">
import ogImage from "~/assets/images/face.webp?url&no-inline"

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const requestUrl = useRequestURL()
const siteOrigin = computed(() => (runtimeConfig.public.siteUrl || requestUrl.origin).replace(/\/$/, ""))
const canonicalUrl = computed(() => new URL(route.path, `${siteOrigin.value}/`).href)
const isPrivateRoute = computed(() => /^\/(?:edit|settings|login|new|search)(?:\/|$)/.test(route.path))
const ogImageUrl = computed(() => new URL(ogImage, `${siteOrigin.value}/`).href)
const defaultDescription = "こは鯖の情報をまとめたMinecraftサーバーWiki"

useHead(() => ({
  htmlAttrs: { lang: "ja" },
  link: [{ key: "canonical", rel: "canonical", href: canonicalUrl.value }],
}))

useSeoMeta({
  description: defaultDescription,
  ogTitle: "こは鯖wiki",
  ogDescription: defaultDescription,
  ogImage: ogImageUrl,
  ogImageAlt: "こは鯖wiki",
  ogSiteName: "こは鯖wiki",
  ogLocale: "ja_JP",
  ogType: "website",
  ogUrl: canonicalUrl,
  twitterCard: "summary",
  twitterTitle: "こは鯖wiki",
  twitterDescription: defaultDescription,
  twitterImage: ogImageUrl,
  twitterImageAlt: "こは鯖wiki",
  robots: () => isPrivateRoute.value ? "noindex, nofollow" : "index, follow",
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToaster />
</template>
