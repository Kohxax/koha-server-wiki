<script setup lang="ts">
import { FolderCogIcon, ImageIcon, LayoutDashboardIcon, UsersIcon, WaypointsIcon } from "@lucide/vue"
import type { Component } from "vue"
import { visibleSettingsMenu, type SettingsIcon } from "~/lib/settings-menu"

interface Summary {
  pageCount: number
  mediaCount: number
  userCount?: number
  recentPages: { path: string, title: string, updatedAt: string, username: string | null }[]
}

const { user } = useUserSession()
const { data: summary } = await useFetch<Summary>("/api/settings/summary", { key: "settings-summary" })
const menu = computed(() => visibleSettingsMenu(user.value?.role).filter(item => item.id !== "overview"))

const icons: Record<SettingsIcon, Component> = {
  dashboard: LayoutDashboardIcon,
  pages: WaypointsIcon,
  sidebar: FolderCogIcon,
  media: ImageIcon,
  users: UsersIcon,
}

function pageUrl(path: string) {
  return path === "home" ? "/" : `/wiki/${path}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

useHead({ title: "設定" })
</script>

<template>
  <div class="mx-auto max-w-5xl py-2 sm:py-6">
    <div class="mb-6">
      <h1 class="text-xl font-semibold">管理ダッシュボード</h1>
      <p class="mt-1 text-sm text-muted-foreground">Wikiのコンテンツと設定を管理します。</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <UiCard>
        <UiCardHeader class="pb-2"><UiCardDescription>ページ数</UiCardDescription></UiCardHeader>
        <UiCardContent><p class="text-3xl font-semibold">{{ summary?.pageCount ?? 0 }}</p></UiCardContent>
      </UiCard>
      <UiCard>
        <UiCardHeader class="pb-2"><UiCardDescription>メディア数</UiCardDescription></UiCardHeader>
        <UiCardContent><p class="text-3xl font-semibold">{{ summary?.mediaCount ?? 0 }}</p></UiCardContent>
      </UiCard>
      <UiCard v-if="user?.role === 'admin'">
        <UiCardHeader class="pb-2"><UiCardDescription>ユーザー数</UiCardDescription></UiCardHeader>
        <UiCardContent><p class="text-3xl font-semibold">{{ summary?.userCount ?? 0 }}</p></UiCardContent>
      </UiCard>
    </div>

    <section class="mt-6">
      <h2 class="mb-3 text-base font-semibold">管理項目</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <NuxtLink v-for="item in menu" :key="item.id" :to="item.to" class="group">
          <UiCard class="h-full transition-colors group-hover:bg-muted">
            <UiCardHeader class="flex-row items-center gap-3 space-y-0">
              <component :is="icons[item.icon]" class="size-5" />
              <div>
                <UiCardTitle class="text-base">{{ item.label }}</UiCardTitle>
                <UiCardDescription>{{ item.description }}</UiCardDescription>
              </div>
            </UiCardHeader>
          </UiCard>
        </NuxtLink>
      </div>
    </section>

    <section class="mt-6">
      <h2 class="mb-3 text-base font-semibold">最近更新されたページ</h2>
      <UiCard>
        <UiCardContent class="p-0">
          <ul v-if="summary?.recentPages.length" class="divide-y">
            <li v-for="page in summary.recentPages" :key="page.path" class="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <NuxtLink :to="pageUrl(page.path)" class="font-medium hover:underline">{{ page.title }}</NuxtLink>
                <p class="font-mono text-xs text-muted-foreground">{{ page.path }}</p>
              </div>
              <p class="text-right text-xs text-muted-foreground">
                {{ formatDate(page.updatedAt) }}<br>
                {{ page.username ?? "不明なユーザー" }}
              </p>
            </li>
          </ul>
          <p v-else class="p-4 text-sm text-muted-foreground">まだページがありません</p>
        </UiCardContent>
      </UiCard>
    </section>
  </div>
</template>
