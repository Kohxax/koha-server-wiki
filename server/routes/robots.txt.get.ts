export default defineEventHandler((event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const siteOrigin = (runtimeConfig.public.siteUrl || requestUrl.origin).replace(/\/$/, "")

  setHeader(event, "content-type", "text/plain; charset=utf-8")
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`
})
