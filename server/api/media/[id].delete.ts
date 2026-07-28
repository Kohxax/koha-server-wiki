import { readFile, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { eq, ilike } from "drizzle-orm"
import { media, pages } from "../../database/schema"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const { db, id, media: existing } = await requireMediaById(event)

  const references = await db.select({ path: pages.path, title: pages.title }).from(pages)
    .where(ilike(pages.content, `%/uploads/${existing.filename}%`))
  if (references.length)
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
