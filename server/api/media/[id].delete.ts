import { readFile, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { eq, ilike } from "drizzle-orm"
import { useDb } from "../../database/client"
import { media, pages } from "../../database/schema"

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

  const [reference] = await db.select({ id: pages.id }).from(pages)
    .where(ilike(pages.content, `%/uploads/${existing.filename}%`)).limit(1)
  if (reference)
    throw createError({ statusCode: 409, statusMessage: "This media is still referenced by a page. Remove the reference first." })

  const filePath = join(uploadDir(), existing.filename)
  const backup = await readFile(filePath).catch(() => null)
  if (!backup)
    throw createError({ statusCode: 500, statusMessage: "Media file is missing" })

  await unlink(filePath)
  try {
    await db.delete(media).where(eq(media.id, id))
  } catch (error) {
    await writeFile(filePath, backup).catch(() => {})
    throw error
  }

  return { ok: true }
})
