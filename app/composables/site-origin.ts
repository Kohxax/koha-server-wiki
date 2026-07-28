/** The public origin of the site, preferring the configured `siteUrl` over the current request's origin. */
export function useSiteOrigin() {
  const runtimeConfig = useRuntimeConfig()
  const requestUrl = useRequestURL()
  return computed(() => (runtimeConfig.public.siteUrl || requestUrl.origin).replace(/\/$/, ""))
}
