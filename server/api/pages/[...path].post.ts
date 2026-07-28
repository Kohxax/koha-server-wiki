import { z } from "zod"
import { useDb } from "../../database/client"
import { duplicatePage } from "../../services/pages"

const bodySchema = z.object({
  path: pagePathSchema,
  title: z.string().trim().min(1).max(200),
})

export default defineEventHandler(async (event) => {
  const editor = await requireEditor(event)

  const sourcePath = requirePagePath(event)

  const body = await readValidatedBody(event, bodySchema.parse)
  return await duplicatePage(useDb(), editor, sourcePath, body)
})
