import { useDb } from "../../database/client"
import { deletePage } from "../../services/pages"

export default defineEventHandler(async (event) => {
  await requireEditor(event)

  const path = requirePagePath(event)

  await deletePage(useDb(), path)
  return { ok: true }
})
