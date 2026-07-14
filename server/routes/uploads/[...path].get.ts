import { createReadStream, existsSync } from "node:fs"
import { extname, join } from "node:path"

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, "path") ?? ""

  if (raw.includes("..") || raw.includes("/") || raw.length === 0)
    throw createError({ statusCode: 400, statusMessage: "Invalid path" })

  const filePath = join(uploadDir(), raw)
  if (!existsSync(filePath))
    throw createError({ statusCode: 404, statusMessage: "Not Found" })

  const ext = extname(raw).slice(1).toLowerCase()
  setHeader(event, "Content-Type", extToMime(ext))
  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable")

  return sendStream(event, createReadStream(filePath))
})
