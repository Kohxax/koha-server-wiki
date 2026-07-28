<script setup lang="ts">
import grassBlockUrl from "~/assets/images/grassblock.webp?url&no-inline"
import { formatDate } from "~/lib/format-date"
import type { LinkPreviewDto } from "~~/shared/types/api"

defineProps<{
  open: boolean
  preview: LinkPreviewDto | undefined
  position: { left: number, top: number }
}>()

function useFallbackPreviewImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  image.onerror = null
  image.src = grassBlockUrl
}

function formatPreviewUpdatedAt(value: string | null): string | null {
  return value ? formatDate(value) : null
}
</script>

<template>
  <div
    v-if="open"
    role="tooltip"
    class="pointer-events-none fixed z-30 w-80 overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg"
    :style="{ left: `${position.left}px`, top: `${position.top}px` }"
  >
    <div v-if="!preview" class="space-y-3 p-3">
      <UiSkeleton class="h-28 w-full" />
      <UiSkeleton class="h-4 w-2/3" />
      <UiSkeleton class="h-3 w-full" />
    </div>
    <template v-else>
      <img :src="preview.imageUrl ?? grassBlockUrl" :alt="`${preview.title} のプレビュー画像`" class="h-28 w-full border-b border-border object-cover" loading="lazy" referrerpolicy="no-referrer" @error="useFallbackPreviewImage">
      <div class="space-y-1.5 p-3">
        <p class="line-clamp-2 text-sm font-semibold leading-5">{{ preview.title }}</p>
        <p v-if="preview.description" class="line-clamp-3 text-xs leading-5 text-muted-foreground">{{ preview.description }}</p>
        <p v-if="preview.siteName || formatPreviewUpdatedAt(preview.updatedAt)" class="text-xs text-muted-foreground">
          {{ preview.siteName ?? formatPreviewUpdatedAt(preview.updatedAt) }}
        </p>
      </div>
    </template>
  </div>
</template>
