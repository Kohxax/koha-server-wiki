export default defineNuxtPlugin(() => {
  const router = useRouter()
  const duration = 120
  let initialNavigation = true

  router.beforeEach(async () => {
    if (initialNavigation) {
      initialNavigation = false
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return

    document.documentElement.classList.add('page-is-leaving')
    await new Promise(resolve => window.setTimeout(resolve, duration))
  })

  router.afterEach(() => {
    document.documentElement.classList.remove('page-is-leaving')
  })
})
