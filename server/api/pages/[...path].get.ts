import { eq } from "drizzle-orm"
import { useDb } from "../../database/client"
import { pages, users } from "../../database/schema"

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const db = useDb()
  const [page] = await db.select({
    id: pages.id,
    path: pages.path,
    title: pages.title,
    content: pages.content,
    createdBy: pages.createdBy,
    updatedBy: pages.updatedBy,
    createdAt: pages.createdAt,
    updatedAt: pages.updatedAt,
    updatedByUsername: users.username,
  }).from(pages).leftJoin(users, eq(pages.updatedBy, users.id)).where(eq(pages.path, path))
  if (!page)
    throw createError({ statusCode: 404, statusMessage: "Page not found" })

  return page
})
