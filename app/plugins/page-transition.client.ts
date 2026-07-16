export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const duration = 120
  let initialNavigation = true
  let transitionPending = false

  router.beforeEach(async () => {
    if (initialNavigation) {
      initialNavigation = false
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return

    transitionPending = true
    document.documentElement.classList.add('page-is-leaving')
    await new Promise(resolve => window.setTimeout(resolve, duration))
  })

  nuxtApp.hook('page:finish', async () => {
    if (!transitionPending)
      return

    await nextTick()
    window.requestAnimationFrame(() => {
      document.documentElement.classList.remove('page-is-leaving')
      transitionPending = false
    })
  })

  router.onError(() => {
    document.documentElement.classList.remove('page-is-leaving')
    transitionPending = false
  })
})
