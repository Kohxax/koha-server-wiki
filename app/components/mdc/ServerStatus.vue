<script setup lang="ts">
import { ServerCrashIcon, ServerIcon, UsersIcon } from "@lucide/vue"

interface ServerStatus {
  address: string
  online: boolean
  players?: { online: number, max: number }
  version?: string
  description?: string
  favicon?: string
}

const props = defineProps<{ address: string }>()
const endpoint = computed(() => `/api/server-status?address=${encodeURIComponent(props.address)}`)
const { data, status, error, refresh } = useFetch<ServerStatus>(endpoint, {
  key: () => `minecraft-server-status:${props.address}`,
  server: false,
  lazy: true,
})

const loading = computed(() => status.value === "idle" || status.value === "pending")
const unavailable = computed(() => !!error.value || data.value?.online === false)
</script>

<template>
  <section class="my-6 border border-border bg-card p-4 text-card-foreground" :aria-label="`${address}のサーバーステータス`" aria-live="polite">
    <div class="flex min-w-0 items-center gap-3">
      <img v-if="data?.favicon" :src="data.favicon" alt="" class="size-12 shrink-0 border border-border" />
      <div v-else class="grid size-12 shrink-0 place-items-center border border-border bg-muted text-muted-foreground">
        <ServerIcon class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate font-mono text-sm font-medium">{{ address }}</p>
        <p v-if="loading" class="mt-1 text-sm text-muted-foreground">ステータスを取得中…</p>
        <p v-else-if="unavailable" class="mt-1 flex items-center gap-1 text-sm text-destructive"><ServerCrashIcon class="size-4" />オフライン</p>
        <template v-else>
          <p class="mt-1 flex items-center gap-1 text-sm text-primary"><span class="size-2 rounded-full bg-primary" />オンライン</p>
          <p v-if="data?.description" class="mt-1 truncate text-sm text-muted-foreground">{{ data.description }}</p>
        </template>
      </div>
      <div v-if="data?.online && data.players" class="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
        <UsersIcon class="size-4" />{{ data.players.online }} / {{ data.players.max }}
      </div>
    </div>
    <p v-if="data?.online && data.version" class="mt-3 border-t pt-3 text-xs text-muted-foreground">Minecraft {{ data.version }}</p>
    <UiButton v-if="unavailable" class="mt-3" size="sm" variant="outline" @click="refresh">再試行</UiButton>
  </section>
</template>
