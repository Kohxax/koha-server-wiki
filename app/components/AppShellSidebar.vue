<script setup lang="ts">
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "@lucide/vue"

const props = defineProps<{
  open: boolean
  /** Pins the sidebar to the viewport while its page scrolls (main site sidebar) instead of scrolling with the page (settings sidebar). */
  sticky?: boolean
}>()
const emit = defineEmits<{ toggle: [] }>()

// Suppresses the mobile overlay/backdrop for a single frame after mount so a
// narrow viewport never flashes the sidebar open before the collapse below
// applies.
const ready = ref(false)

onMounted(() => {
  // `open` always starts `true` (see the `useState` defaults in the layouts),
  // so a single toggle reliably collapses it for a first mobile load.
  if (props.open && window.matchMedia("(max-width: 767px)").matches)
    emit("toggle")
  ready.value = true
})
</script>

<template>
  <button
    v-if="ready && open"
    class="fixed inset-0 z-40 bg-foreground/20 md:hidden"
    aria-label="サイドバーを閉じる"
    @click="emit('toggle')"
  />
  <aside
    class="app-shell app-sidebar fixed top-14 bottom-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-hidden border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-out md:z-auto md:translate-x-0 md:transition-[width]"
    :class="[
      sticky ? 'md:sticky md:top-14 md:bottom-auto md:h-[calc(100dvh-3.5rem)] md:self-start' : 'md:relative md:top-auto',
      !ready ? 'max-md:-translate-x-full md:w-64' : open ? 'translate-x-0 md:w-64' : '-translate-x-full md:w-12',
    ]"
  >
    <div class="flex shrink-0 border-b p-2" :class="open ? 'w-64 justify-end' : 'w-12 justify-center'">
      <UiButton variant="ghost" size="icon-sm" :aria-label="open ? 'サイドバーを閉じる' : 'サイドバーを開く'" @click="emit('toggle')">
        <PanelLeftCloseIcon v-if="open" />
        <PanelLeftOpenIcon v-else />
      </UiButton>
    </div>
    <UiScrollArea v-show="open" class="min-h-0 w-64 flex-1 p-4">
      <slot />
    </UiScrollArea>
  </aside>
  <UiButton
    v-if="ready && !open"
    class="fixed bottom-5 left-5 z-40 shadow-md md:hidden"
    variant="outline"
    size="icon"
    aria-label="メニューを開く"
    @click="emit('toggle')"
  >
    <MenuIcon />
  </UiButton>
</template>
