import { asc, ilike, or, sql } from "drizzle-orm"
import { useDb } from "../database/client"
import { pages } from "../database/schema"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = typeof query.q === "string" ? query.q.trim() : ""
  const requestedLimit = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 20
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 20) : 20
  if (!q)
    return []

  const db = useDb()
  const pattern = `%${q}%`
  const rows = await db.select({ path: pages.path, title: pages.title, description: pages.description, content: pages.content })
    .from(pages)
    .where(or(ilike(pages.title, pattern), ilike(pages.description, pattern), ilike(pages.content, pattern)))
    .orderBy(sql`case when ${pages.title} ilike ${pattern} then 0 else 1 end`, asc(pages.title))
    .limit(limit)

  return rows.map(row => ({
    path: row.path,
    title: row.title,
    excerpt: buildExcerpt([row.description, row.content].filter(Boolean).join("\n"), q),
  }))
})
