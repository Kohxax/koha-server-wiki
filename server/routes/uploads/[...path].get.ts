import { createReadStream, existsSync, statSync } from "node:fs"
import { extname, join } from "node:path"

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, "path") ?? ""

  if (raw.includes("..") || raw.includes("/") || raw.length === 0)
    throw createError({ statusCode: 400, statusMessage: "Invalid path" })

  const filePath = join(uploadDir(), raw)
  if (!existsSync(filePath))
    throw createError({ statusCode: 404, statusMessage: "Not Found" })

  const ext = extname(raw).slice(1).toLowerCase()
  const stats = statSync(filePath)
  const etag = `W/"${stats.size}-${Math.floor(stats.mtimeMs)}"`
  if (getHeader(event, "if-none-match") === etag) {
    setResponseStatus(event, 304)
    return null
  }
  setHeader(event, "Content-Type", extToMime(ext))
  setHeader(event, "ETag", etag)
  setHeader(event, "Cache-Control", "public, max-age=0, must-revalidate")
  if (ext === "svg") {
    setHeader(event, "X-Content-Type-Options", "nosniff")
    setHeader(event, "Content-Security-Policy", "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:")
  }

  return sendStream(event, createReadStream(filePath))
})
