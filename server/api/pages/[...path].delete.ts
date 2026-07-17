import { eq } from "drizzle-orm"
import { isValidPagePath, normalizePagePath } from "../../../shared/utils/page-path"
import { useDb } from "../../database/client"
import { pages } from "../../database/schema"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const db = useDb()
  const [existing] = await db.select().from(pages).where(eq(pages.path, path))
  if (!existing)
    throw createError({ statusCode: 404, statusMessage: "Page not found" })

  await db.delete(pages).where(eq(pages.id, existing.id))
  return { ok: true }
})
