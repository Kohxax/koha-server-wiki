export default defineEventHandler((event) => {
  const siteOrigin = resolveSiteOrigin(event)

  setHeader(event, "content-type", "text/plain; charset=utf-8")
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`
})
