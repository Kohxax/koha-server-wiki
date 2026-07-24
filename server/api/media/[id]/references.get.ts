import { eq } from "drizzle-orm"
import { useDb } from "../../../database/client"
import { media } from "../../../database/schema"
import { findMediaReferences } from "../../../services/media"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const id = Number(getRouterParam(event, "id") ?? "")
  if (!Number.isInteger(id))
    throw createError({ statusCode: 400, statusMessage: "Invalid media id" })

  const db = useDb()
  const [existing] = await db.select({ filename: media.filename }).from(media).where(eq(media.id, id))
  if (!existing)
    throw createError({ statusCode: 404, statusMessage: "Media not found" })

  return findMediaReferences(db, existing.filename)
})
