<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, Maximize2Icon, Minimize2Icon, XIcon } from "@lucide/vue"

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
}>(), {
  src: "",
  alt: "",
})

const open = ref(false)
const expanded = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const viewerId = useId()
const imageIndex = ref(0)
const imageCount = ref(1)
const colorMode = useColorMode()
const label = computed(() => props.alt ? `画像を拡大: ${props.alt}` : "画像を拡大")
const canShowPrevious = computed(() => imageIndex.value > 0)
const canShowNext = computed(() => imageIndex.value < imageCount.value - 1)
const overlayClass = computed(() => colorMode.value === "dark"
  ? "bg-black/75 supports-backdrop-filter:backdrop-blur-sm"
  : "bg-black/55 supports-backdrop-filter:backdrop-blur-sm")
const controlClass = computed(() => colorMode.value === "dark"
  ? "border-zinc-500/70 bg-zinc-900/95 text-zinc-100 shadow-lg hover:bg-zinc-800"
  : "border-white/30 bg-black/65 text-white shadow-lg hover:bg-black/80")

function viewerTriggers() {
  const group = triggerRef.value?.closest<HTMLElement>("[data-image-viewer-group]")
  return group ? Array.from(group.querySelectorAll<HTMLButtonElement>("[data-image-viewer-trigger]")) : []
}

function updateImagePosition() {
  const triggers = viewerTriggers()
  imageCount.value = triggers.length || 1
  imageIndex.value = Math.max(0, triggers.findIndex(trigger => trigger.dataset.imageViewerId === viewerId))
}

function openViewer() {
  updateImagePosition()
  expanded.value = false
  open.value = true
  window.dispatchEvent(new CustomEvent("image-viewer:open", { detail: viewerId }))
}

function handleViewerOpen(event: Event) {
  open.value = (event as CustomEvent<string>).detail === viewerId
}

function showImage(offset: number) {
  viewerTriggers()[imageIndex.value + offset]?.click()
}

watch(open, (isOpen) => {
  if (!isOpen)
    expanded.value = false
})

onMounted(() => window.addEventListener("image-viewer:open", handleViewerOpen))
onBeforeUnmount(() => window.removeEventListener("image-viewer:open", handleViewerOpen))
</script>

<template>
  <UiDialog v-model:open="open">
    <button
      ref="triggerRef"
      type="button"
      class="block w-full max-w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :aria-label="label"
      :data-image-viewer-id="viewerId"
      data-image-viewer-trigger
      @click="openViewer"
    >
      <img :src="src" :alt="alt" class="mx-auto h-auto max-w-full border border-border" loading="lazy">
    </button>
    <UiDialogContent
      :show-close-button="false"
      :overlay-class="overlayClass"
      class="top-0 left-0 h-dvh max-h-none w-dvw max-w-none translate-x-0 translate-y-0 border-0 bg-transparent p-4 sm:max-w-none"
    >
      <UiDialogTitle class="sr-only">{{ alt || "画像ビューアー" }}</UiDialogTitle>
      <div class="absolute top-4 right-4 z-10 flex gap-2">
        <UiButton type="button" variant="outline" size="icon-lg" :class="controlClass" :aria-label="expanded ? '通常表示' : '拡大表示'" @click="expanded = !expanded">
          <Minimize2Icon v-if="expanded" />
          <Maximize2Icon v-else />
        </UiButton>
        <UiButton type="button" variant="outline" size="icon-lg" :class="controlClass" aria-label="閉じる" @click="open = false">
          <XIcon />
        </UiButton>
      </div>
      <div class="flex size-full items-center justify-center overflow-auto p-16">
        <img :src="src" :alt="alt" :class="expanded ? 'size-full object-contain' : 'max-h-full max-w-full object-contain'">
      </div>
      <UiButton
        v-if="canShowPrevious"
        type="button"
        variant="outline"
        size="icon-lg"
        :class="['absolute top-1/2 left-5 z-10 -translate-y-1/2', controlClass]"
        aria-label="前の画像"
        @click="showImage(-1)"
      >
        <ChevronLeftIcon />
      </UiButton>
      <UiButton
        v-if="canShowNext"
        type="button"
        variant="outline"
        size="icon-lg"
        :class="['absolute top-1/2 right-5 z-10 -translate-y-1/2', controlClass]"
        aria-label="次の画像"
        @click="showImage(1)"
      >
        <ChevronRightIcon />
      </UiButton>
      <p v-if="alt" class="absolute right-16 bottom-4 left-16 text-center text-xs text-white/85 drop-shadow">{{ alt }}</p>
    </UiDialogContent>
  </UiDialog>
</template>
