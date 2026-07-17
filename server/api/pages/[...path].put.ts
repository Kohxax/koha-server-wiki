import { z } from "zod"
import { isValidPagePath, normalizePagePath, pagePathSchema } from "../../../shared/utils/page-path"
import { useDb } from "../../database/client"
import { savePage } from "../../services/pages"

const bodySchema = z.object({
  path: pagePathSchema.optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().default(""),
  content: z.string(),
  expectedUpdatedAt: z.string().datetime().nullable(),
})

export default defineEventHandler(async (event) => {
  const editor = await requireEditor(event)

  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const body = await readValidatedBody(event, bodySchema.parse)
  return await savePage(useDb(), editor, path, { ...body, path: body.path ?? path })
})
