import { desc, eq } from "drizzle-orm"
import { useDb } from "../../database/client"
import { pageRevisions, pages } from "../../database/schema"

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const db = useDb()
  const [page] = await db.select().from(pages).where(eq(pages.path, path))
  if (!page)
    throw createError({ statusCode: 404, statusMessage: "Page not found" })

  const revisions = await db.select().from(pageRevisions)
    .where(eq(pageRevisions.pageId, page.id))
    .orderBy(desc(pageRevisions.createdAt))

  return revisions
})
