import { desc } from "drizzle-orm"
import { useDb } from "../../database/client"
import { users } from "../../database/schema"

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  return db.select().from(users).orderBy(desc(users.createdAt))
})
