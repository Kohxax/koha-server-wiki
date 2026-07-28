<script setup lang="ts">
import { ArrowUpIcon } from '@lucide/vue'
import { usePreferredReducedMotion } from '@vueuse/core'

const visible = ref(false)
const reducedMotion = usePreferredReducedMotion()

function updateVisibility() {
  visible.value = window.scrollY >= window.innerHeight / 2
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: reducedMotion.value === 'reduce' ? 'auto' : 'smooth' })
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
