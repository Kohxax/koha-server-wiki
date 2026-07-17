import { unlink } from "node:fs/promises"
import { join } from "node:path"
import sharp from "sharp"
import { useDb } from "../../database/client"
import { media } from "../../database/schema"

const MAX_WIDTH = 1920

export default defineEventHandler(async (event) => {
  const user = await requireEditor(event)

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(part => part.name === "file" && part.filename)
  if (!filePart || !filePart.filename)
    throw createError({ statusCode: 400, statusMessage: "ファイルがありません" })

  if (filePart.data.byteLength > MAX_UPLOAD_SIZE)
    throw createError({ statusCode: 413, statusMessage: "ファイルサイズが上限(20MB)を超えています" })

  const mime = filePart.type ?? ""
  if (!isAllowedMime(mime))
    throw createError({ statusCode: 415, statusMessage: "サポートされていないファイル形式です" })

  const kindField = parts?.find(part => part.name === "kind")
  const kind = kindField?.data.toString("utf8") === "diagram" ? "diagram" : "image"

  let ext = ALLOWED_MIME_TO_EXT[mime]
  if (!ext)
    throw createError({ statusCode: 415, statusMessage: "サポートされていないファイル形式です" })

  let outputBuffer: Buffer = filePart.data
  let outputMime = mime

  if (mime === "image/svg+xml") {
    const text = filePart.data.toString("utf8")
    if (!isSafeSvg(text, { allowForeignObject: kind === "diagram" }))
      throw createError({ statusCode: 422, statusMessage: "安全でないSVGです" })
  } else {
    try {
      const image = sharp(filePart.data, { animated: mime === "image/gif" })
      const metadata = await image.metadata()
      if (metadata.format !== mime.slice("image/".length))
        throw new Error("MIME does not match image content")
      if (mime !== "image/gif") {
        outputBuffer = await image.resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp().toBuffer()
        outputMime = "image/webp"
        ext = "webp"
      }
    } catch {
      throw createError({ statusCode: 415, statusMessage: "画像データがファイル形式と一致しません" })
    }
  }

  const filename = generateFilename(ext)
  await writeUploadAtomically(filename, outputBuffer)

  const db = useDb()
  let created
  try {
    [created] = await db.insert(media).values({
      filename,
      originalName: filePart.filename,
      mime: outputMime,
      size: outputBuffer.byteLength,
      kind,
      uploadedBy: user.id,
    }).returning()
  } catch (error) {
    await unlink(join(uploadDir(), filename)).catch(() => {})
    throw error
  }

  if (!created)
    throw new Error("Failed to save media")

  return created
})
