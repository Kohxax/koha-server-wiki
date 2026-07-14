import { ilike, or } from "drizzle-orm"
import { useDb } from "../database/client"
import { pages } from "../database/schema"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = typeof query.q === "string" ? query.q.trim() : ""
  if (!q)
    return []

  const db = useDb()
  const pattern = `%${q}%`
  const rows = await db.select({ path: pages.path, title: pages.title, content: pages.content })
    .from(pages)
    .where(or(ilike(pages.title, pattern), ilike(pages.content, pattern)))
    .limit(20)

  return rows.map(row => ({
    path: row.path,
    title: row.title,
    excerpt: buildExcerpt(row.content, q),
  }))
})
