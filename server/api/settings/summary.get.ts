import { count, desc, eq } from "drizzle-orm"
import { useDb } from "../../database/client"
import { media, pages, users } from "../../database/schema"

export default defineEventHandler(async (event) => {
  const currentUser = await requireEditor(event)
  const db = useDb()

  const [[pageTotal], [mediaTotal], recentPages] = await Promise.all([
    db.select({ count: count() }).from(pages),
    db.select({ count: count() }).from(media),
    db.select({
      path: pages.path,
      title: pages.title,
      updatedAt: pages.updatedAt,
      username: users.username,
    })
      .from(pages)
      .leftJoin(users, eq(pages.updatedBy, users.id))
      .orderBy(desc(pages.updatedAt))
      .limit(5),
  ])

  const summary = {
    pageCount: Number(pageTotal?.count ?? 0),
    mediaCount: Number(mediaTotal?.count ?? 0),
    recentPages,
  }

  if (currentUser.role !== "admin")
    return summary

  const [userTotal] = await db.select({ count: count() }).from(users)
  return { ...summary, userCount: Number(userTotal?.count ?? 0) }
})
