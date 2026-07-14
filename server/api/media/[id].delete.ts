import { unlink } from "node:fs/promises"
import { join } from "node:path"
import { eq } from "drizzle-orm"
import { useDb } from "../../database/client"
import { media } from "../../database/schema"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const idParam = getRouterParam(event, "id") ?? ""
  const id = Number(idParam)
  if (!Number.isInteger(id))
    throw createError({ statusCode: 400, statusMessage: "Invalid media id" })

  const db = useDb()
  const [existing] = await db.select().from(media).where(eq(media.id, id))
  if (!existing)
    throw createError({ statusCode: 404, statusMessage: "Media not found" })

  await db.delete(media).where(eq(media.id, id))

  await unlink(join(uploadDir(), existing.filename)).catch(() => {})

  return { ok: true }
})
