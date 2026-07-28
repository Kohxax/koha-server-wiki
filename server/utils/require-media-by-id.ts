import type { H3Event } from "h3"
import { createError, getRouterParam } from "h3"
import { eq } from "drizzle-orm"
import { useDb } from "../database/client"
import { media } from "../database/schema"
import type { Media } from "../database/schema"

/** Reads and validates the `id` route param and loads the matching media row, or throws 400/404. */
export async function requireMediaById(event: H3Event): Promise<{ db: ReturnType<typeof useDb>, id: number, media: Media }> {
  const idParam = getRouterParam(event, "id") ?? ""
  const id = Number(idParam)
  if (!Number.isInteger(id))
    throw createError({ statusCode: 400, statusMessage: "Invalid media id" })

  const db = useDb()
  const [existing] = await db.select().from(media).where(eq(media.id, id))
  if (!existing)
    throw createError({ statusCode: 404, statusMessage: "Media not found" })

  return { db, id, media: existing }
}
