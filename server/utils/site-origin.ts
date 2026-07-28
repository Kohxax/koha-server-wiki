import type { H3Event } from "h3"

/** The public origin of the site, preferring the configured `siteUrl` over the request's own origin. */
export function resolveSiteOrigin(event: H3Event): string {
  const runtimeConfig = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  return (runtimeConfig.public.siteUrl || requestUrl.origin).replace(/\/$/, "")
}
