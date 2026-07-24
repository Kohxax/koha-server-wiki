import { z } from "zod"
import { isValidPagePath, normalizePagePath, pagePathSchema } from "../../../shared/utils/page-path"
import { useDb } from "../../database/client"
import { duplicatePage } from "../../services/pages"

const bodySchema = z.object({
  path: pagePathSchema,
  title: z.string().trim().min(1).max(200),
})

export default defineEventHandler(async (event) => {
  const editor = await requireEditor(event)

  const raw = getRouterParam(event, "path") ?? ""
  const sourcePath = normalizePagePath(raw)
  if (!isValidPagePath(sourcePath))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const body = await readValidatedBody(event, bodySchema.parse)
  return await duplicatePage(useDb(), editor, sourcePath, body)
})
