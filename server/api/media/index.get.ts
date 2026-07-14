import { desc } from "drizzle-orm"
import { useDb } from "../../database/client"
import { media } from "../../database/schema"

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const db = useDb()
  return db.select().from(media).orderBy(desc(media.createdAt))
})
