import { eq } from "drizzle-orm"
import { z } from "zod"
import { useDb } from "../../database/client"
import { pageRevisions, pages, settings } from "../../database/schema"
import { pagePathSchema } from "../../utils/path"
import { replacePagePathInTree } from "../../utils/sidebar-tree"
import type { TreeNode } from "../../utils/tree"

const bodySchema = z.object({
  path: pagePathSchema.optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().default(""),
  content: z.string(),
})

export default defineEventHandler(async (event) => {
  const editor = await requireEditor(event)

  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  const { path: requestedPath, title, description, content } = await readValidatedBody(event, bodySchema.parse)
  const nextPath = requestedPath ?? path
  if (path === "home" && nextPath !== "home")
    throw createError({ statusCode: 400, statusMessage: "The home page cannot be moved" })
  if (path !== "home" && nextPath === "home")
    throw createError({ statusCode: 400, statusMessage: "The home page path is reserved" })

  const normalizedDescription = description || null

  const db = useDb()
  const [existing] = await db.select().from(pages).where(eq(pages.path, path))

  if (existing) {
    if (nextPath !== path) {
      const [conflict] = await db.select({ id: pages.id }).from(pages).where(eq(pages.path, nextPath))
      if (conflict)
        throw createError({ statusCode: 409, statusMessage: "Page path already exists" })
    }

    const updated = await db.transaction(async (tx) => {
      await tx.insert(pageRevisions).values({
        pageId: existing.id,
        title: existing.title,
        description: existing.description,
        content: existing.content,
        editedBy: existing.updatedBy ?? existing.createdBy,
      })

      const [savedPage] = await tx.update(pages)
        .set({ path: nextPath, title, description: normalizedDescription, content, updatedBy: editor.id, updatedAt: new Date() })
        .where(eq(pages.id, existing.id))
        .returning()
      if (!savedPage)
        throw new Error("Failed to update page")

      if (nextPath !== path) {
        const [sidebarTree] = await tx.select().from(settings).where(eq(settings.key, "sidebar_tree"))
        if (sidebarTree && Array.isArray(sidebarTree.value)) {
          await tx.update(settings)
            .set({ value: replacePagePathInTree(sidebarTree.value as TreeNode[], path, nextPath) })
            .where(eq(settings.key, "sidebar_tree"))
        }
      }

      return savedPage
    })
    if (!updated)
      throw new Error("Failed to update page")
    return updated
  }

  const [created] = await db.insert(pages)
    .values({ path: nextPath, title, description: normalizedDescription, content, createdBy: editor.id, updatedBy: editor.id })
    .returning()
  if (!created)
    throw new Error("Failed to create page")
  return created
})
