import { desc, eq } from "drizzle-orm"
import { useDb } from "../../database/client"
import { pageRevisions, pages, users } from "../../database/schema"

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const db = useDb()
  const [page] = await db.select().from(pages).where(eq(pages.path, path))
  if (!page)
    throw createError({ statusCode: 404, statusMessage: "Page not found" })

  const revisions = await db.select({
    id: pageRevisions.id,
    pageId: pageRevisions.pageId,
    title: pageRevisions.title,
    content: pageRevisions.content,
    createdAt: pageRevisions.createdAt,
    editedByUsername: users.username,
  })
    .from(pageRevisions)
    .leftJoin(users, eq(pageRevisions.editedBy, users.id))
    .where(eq(pageRevisions.pageId, page.id))
    .orderBy(desc(pageRevisions.createdAt))

  const [updater] = page.updatedBy
    ? await db.select({ username: users.username }).from(users).where(eq(users.id, page.updatedBy))
    : [undefined]

  return {
    current: {
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt,
      updatedByUsername: updater?.username ?? null,
    },
    revisions,
  }
})
