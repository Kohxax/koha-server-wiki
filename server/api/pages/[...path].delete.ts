import { isValidPagePath, normalizePagePath } from "../../../shared/utils/page-path"
import { useDb } from "../../database/client"
import { deletePage } from "../../services/pages"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  await deletePage(useDb(), path)
  return { ok: true }
})
