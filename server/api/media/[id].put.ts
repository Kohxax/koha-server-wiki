import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { eq } from "drizzle-orm"
import { media } from "../../database/schema"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const { db, id, media: existing } = await requireMediaById(event)

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(part => part.name === "file" && part.filename)
  if (!filePart)
    throw createError({ statusCode: 400, statusMessage: "ファイルがありません" })

  if (filePart.data.byteLength > MAX_UPLOAD_SIZE)
    throw createError({ statusCode: 413, statusMessage: "ファイルサイズが上限(20MB)を超えています" })

  const mime = filePart.type ?? ""
  if (mime !== "image/svg+xml")
    throw createError({ statusCode: 415, statusMessage: "再編集で上書きできるのはSVG(図表)のみです" })

  const text = filePart.data.toString("utf8")
  if (!isSafeSvg(text, { allowForeignObject: existing.kind === "diagram" }))
    throw createError({ statusCode: 422, statusMessage: "安全でないSVGです" })

  // Overwrite the file in place so the filename (and every page referencing it) stays the same.
  await writeFile(join(uploadDir(), existing.filename), filePart.data)

  const [updated] = await db.update(media)
    .set({ size: filePart.data.byteLength, mime })
    .where(eq(media.id, id))
    .returning()
  if (!updated)
    throw new Error("Failed to update media")

  return updated
})
