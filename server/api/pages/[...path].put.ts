import { eq } from "drizzle-orm"
import { z } from "zod"
import { useDb } from "../../database/client"
import { pageRevisions, pages } from "../../database/schema"

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string(),
})

export default defineEventHandler(async (event) => {
  const editor = await requireEditor(event)

  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const { title, content } = await readValidatedBody(event, bodySchema.parse)

  const db = useDb()
  const [existing] = await db.select().from(pages).where(eq(pages.path, path))

  if (existing) {
    await db.insert(pageRevisions).values({
      pageId: existing.id,
      title: existing.title,
      content: existing.content,
      editedBy: existing.updatedBy ?? existing.createdBy,
    })

    const [updated] = await db.update(pages)
      .set({ title, content, updatedBy: editor.id, updatedAt: new Date() })
      .where(eq(pages.id, existing.id))
      .returning()
    if (!updated)
      throw new Error("Failed to update page")
    return updated
  }

  const [created] = await db.insert(pages)
    .values({ path, title, content, createdBy: editor.id, updatedBy: editor.id })
    .returning()
  if (!created)
    throw new Error("Failed to create page")
  return created
})
