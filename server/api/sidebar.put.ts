import { z } from "zod"
import { useDb } from "../database/client"
import { settings } from "../database/schema"

const treeNodeSchema: z.ZodType<{ label: string, path?: string, children: unknown[] }> = z.lazy(() => z.object({
  label: z.string(),
  path: z.string().optional(),
  children: z.array(treeNodeSchema),
}))

const bodySchema = z.object({
  mode: z.enum(["auto", "manual"]).optional(),
  tree: z.array(treeNodeSchema).optional(),
})

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = useDb()

  if (body.mode) {
    await db.insert(settings)
      .values({ key: "sidebar_mode", value: body.mode })
      .onConflictDoUpdate({ target: settings.key, set: { value: body.mode } })
  }

  if (body.tree) {
    await db.insert(settings)
      .values({ key: "sidebar_tree", value: body.tree })
      .onConflictDoUpdate({ target: settings.key, set: { value: body.tree } })
  }

  return { ok: true }
})
