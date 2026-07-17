import { and, eq } from "drizzle-orm"
import { useDb } from "../database/client"
import type { User } from "../database/schema"
import { pageRevisions, pages, settings } from "../database/schema"
import type { TreeNode } from "../../shared/types/api"
import { removePagePathFromTree, replacePagePathInTree } from "../utils/sidebar-tree"

type Database = ReturnType<typeof useDb>

export interface SavePageInput {
  path: string
  title: string
  description: string
  content: string
  expectedUpdatedAt: string | null
}

export async function savePage(db: Database, editor: User, currentPath: string, input: SavePageInput) {
  if (currentPath === "home" && input.path !== "home")
    throw createError({ statusCode: 400, statusMessage: "The home page cannot be moved" })
  if (currentPath !== "home" && input.path === "home")
    throw createError({ statusCode: 400, statusMessage: "The home page path is reserved" })

  return await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(pages).where(eq(pages.path, currentPath))
    const description = input.description || null

    if (!existing) {
      if (input.expectedUpdatedAt !== null)
        throw createError({ statusCode: 409, statusMessage: "Page was changed or deleted" })

      const [conflict] = await tx.select({ id: pages.id }).from(pages).where(eq(pages.path, input.path))
      if (conflict)
        throw createError({ statusCode: 409, statusMessage: "Page path already exists" })

      const [created] = await tx.insert(pages)
        .values({ path: input.path, title: input.title, description, content: input.content, createdBy: editor.id, updatedBy: editor.id })
        .returning()
      if (!created)
        throw new Error("Failed to create page")
      return created
    }

    if (!input.expectedUpdatedAt || existing.updatedAt.toISOString() !== input.expectedUpdatedAt)
      throw createError({ statusCode: 409, statusMessage: "Page was changed. Reload before saving again." })

    if (input.path !== currentPath) {
      const [conflict] = await tx.select({ id: pages.id }).from(pages).where(eq(pages.path, input.path))
      if (conflict)
        throw createError({ statusCode: 409, statusMessage: "Page path already exists" })
    }

    await tx.insert(pageRevisions).values({
      pageId: existing.id,
      title: existing.title,
      description: existing.description,
      content: existing.content,
      editedBy: existing.updatedBy ?? existing.createdBy,
    })

    const [saved] = await tx.update(pages)
      .set({ path: input.path, title: input.title, description, content: input.content, updatedBy: editor.id, updatedAt: new Date() })
      .where(and(eq(pages.id, existing.id), eq(pages.updatedAt, existing.updatedAt)))
      .returning()
    if (!saved)
      throw createError({ statusCode: 409, statusMessage: "Page was changed. Reload before saving again." })

    if (input.path !== currentPath) {
      const [sidebarTree] = await tx.select().from(settings).where(eq(settings.key, "sidebar_tree"))
      if (sidebarTree && Array.isArray(sidebarTree.value)) {
        await tx.update(settings)
          .set({ value: replacePagePathInTree(sidebarTree.value as TreeNode[], currentPath, input.path) })
          .where(eq(settings.key, "sidebar_tree"))
      }
    }
    return saved
  })
}

export async function deletePage(db: Database, path: string) {
  if (path === "home")
    throw createError({ statusCode: 400, statusMessage: "The home page cannot be deleted" })

  return await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(pages).where(eq(pages.path, path))
    if (!existing)
      throw createError({ statusCode: 404, statusMessage: "Page not found" })

    const [sidebarTree] = await tx.select().from(settings).where(eq(settings.key, "sidebar_tree"))
    if (sidebarTree && Array.isArray(sidebarTree.value)) {
      await tx.update(settings)
        .set({ value: removePagePathFromTree(sidebarTree.value as TreeNode[], path) })
        .where(eq(settings.key, "sidebar_tree"))
    }
    await tx.delete(pages).where(eq(pages.id, existing.id))
  })
}
