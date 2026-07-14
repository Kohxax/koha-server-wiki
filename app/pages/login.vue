<script setup lang="ts">
const config = useRuntimeConfig()
const { fetch: refreshSession } = useUserSession()
const pending = ref(false)

useHead({ title: "ログイン" })

async function devLogin(role: "admin" | "editor" | "viewer") {
  pending.value = true
  try {
    await $fetch("/api/dev/login", { method: "POST", body: { role } })
    await refreshSession()
    await navigateTo("/")
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-sm flex-col items-center gap-6 py-16">
    <h1 class="text-xl font-semibold">
      ログイン
    </h1>
    <UiButton as="a" href="/auth/discord" class="w-full">
      Discordでログイン
    </UiButton>

    <template v-if="config.public.devAuthBypass">
      <UiSeparator />
      <p class="text-sm text-muted-foreground">
        開発用ログイン (NUXT_DEV_AUTH_BYPASS)
      </p>
      <div class="flex w-full gap-2">
        <UiButton variant="outline" class="flex-1" :disabled="pending" @click="devLogin('admin')">
          admin
        </UiButton>
        <UiButton variant="outline" class="flex-1" :disabled="pending" @click="devLogin('editor')">
          editor
        </UiButton>
        <UiButton variant="outline" class="flex-1" :disabled="pending" @click="devLogin('viewer')">
          viewer
        </UiButton>
      </div>
    </template>
  </div>
</template>
