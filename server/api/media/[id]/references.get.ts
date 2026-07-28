import { ilike } from "drizzle-orm"
import { pages } from "../../../database/schema"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const { db, media: existing } = await requireMediaById(event)

  return db.select({ path: pages.path, title: pages.title }).from(pages)
    .where(ilike(pages.content, `%/uploads/${existing.filename}%`))
})
