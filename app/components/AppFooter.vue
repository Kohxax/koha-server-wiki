<script setup lang="ts">
import { formatCopyrightYears } from "~/lib/copyright"

const copyrightYears = useState("copyright-years", () => formatCopyrightYears())
</script>

<template>
  <footer class="border-t bg-sidebar px-4 py-5 text-xs text-muted-foreground sm:px-6 h-40">
    <div class="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <NuxtLink to="/" class="font-medium text-foreground hover:underline">こは鯖wiki</NuxtLink>
      <div class="flex flex-col gap-1 sm:items-end">
        <p>© {{ copyrightYears }} こは鯖wiki</p>
        <p>Minecraft は Mojang Studios の商標です。</p>
      </div>
    </div>
  </footer>
</template>
