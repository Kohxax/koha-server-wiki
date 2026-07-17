<script setup lang="ts">
import { ArrowUpIcon } from '@lucide/vue'

const visible = ref(false)

function updateVisibility() {
  visible.value = window.scrollY >= window.innerHeight / 2
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

onMounted(() => {
  updateVisibility()
  window.addEventListener('scroll', updateVisibility, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', updateVisibility))
</script>

<template>
  <UiButton
    v-show="visible"
    class="fixed right-5 bottom-5 z-40 shadow-md"
    variant="outline"
    size="icon"
    aria-label="ページ上部へ戻る"
    @click="scrollToTop"
  >
    <ArrowUpIcon />
  </UiButton>
</template>
