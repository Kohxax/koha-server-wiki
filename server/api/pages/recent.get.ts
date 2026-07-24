import { desc } from "drizzle-orm"
import { z } from "zod"
import { useDb } from "../../database/client"
import { pages } from "../../database/schema"

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
})

export default defineEventHandler(async (event) => {
  const { limit } = await getValidatedQuery(event, querySchema.parse)
  const db = useDb()

  return await db.select({
    path: pages.path,
    title: pages.title,
    updatedAt: pages.updatedAt,
  })
    .from(pages)
    .orderBy(desc(pages.updatedAt))
    .limit(limit)
})
