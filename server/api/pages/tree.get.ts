import { useDb } from "../../database/client"
import { pages } from "../../database/schema"

export default defineEventHandler(async () => {
  const db = useDb()
  const rows = await db.select({ path: pages.path, title: pages.title }).from(pages)
  return buildPageTree(rows)
})
