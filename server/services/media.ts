import { ilike } from "drizzle-orm"
import type { useDb } from "../database/client"
import { pages } from "../database/schema"

type Database = ReturnType<typeof useDb>

export async function findMediaReferences(db: Database, filename: string) {
  return db.select({ path: pages.path, title: pages.title }).from(pages)
    .where(ilike(pages.content, `%/uploads/${filename}%`))
}
