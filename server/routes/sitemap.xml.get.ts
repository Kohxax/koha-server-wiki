import { pages } from "../database/schema"
import { useDb } from "../database/client"

export default defineEventHandler(async (event) => {
  const siteOrigin = resolveSiteOrigin(event)
  const rows = await useDb().select({ path: pages.path }).from(pages)
  const locations = new Set([new URL("/", `${siteOrigin}/`).href])

  for (const page of rows)
    locations.add(new URL(wikiPageUrl(page.path), `${siteOrigin}/`).href)

  setHeader(event, "content-type", "application/xml; charset=utf-8")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...locations].map(location => `  <url><loc>${location}</loc></url>`).join("\n")}\n</urlset>\n`
})
