import { access } from "node:fs/promises"
import { useDb } from "../database/client"

export default defineEventHandler(async () => {
  try {
    await useDb().execute("SELECT 1")
    await access(uploadDir())
    return { status: "ok" }
  } catch {
    throw createError({ statusCode: 503, statusMessage: "Service unavailable" })
  }
})
