import { readFile, unlink } from "node:fs/promises"
import { join } from "node:path"
import { and, eq, sql } from "drizzle-orm"
import type { useDb } from "../database/client"
import type { User } from "../database/schema"
import { media, pageRevisions, pages, settings } from "../database/schema"
import type { TreeNode } from "../../shared/types/api"
import { removePagePathFromTree, replacePagePathInTree } from "../utils/sidebar-tree"
import { generateFilename, uploadDir, writeUploadAtomically } from "../utils/uploads"

type Database = ReturnType<typeof useDb>

export interface SavePageInput {
  path: string
  title: string
  description: string
  content: string
  expectedUpdatedAt: string | null
}

interface DuplicatePageInput {
  path: string
  title: string
}

interface DiagramReference {
  id: number
  filename: string
}

const DIAGRAM_TAG_PATTERN = /::diagram\{([^}\n]*)\}/g
const MEDIA_ID_PATTERN = /\bmedia-id=(?:"([^"]+)"|'([^']+)'|([^\s}]+))/
const SRC_PATTERN = /\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s}]+))/

function attributeValue(match: RegExpMatchArray | null): string | null {
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null
}

function findDiagramReferences(content: string): DiagramReference[] {
  const references = new Map<number, string>()

  for (const tag of content.matchAll(DIAGRAM_TAG_PATTERN)) {
    const attributes = tag[1] ?? ""
    const rawId = attributeValue(attributes.match(MEDIA_ID_PATTERN))
    if (!rawId)
      continue

    const id = Number(rawId)
    const src = attributeValue(attributes.match(SRC_PATTERN))
    if (!Number.isInteger(id) || id <= 0 || !src)
      throw createError({ statusCode: 400, statusMessage: "Invalid diagram reference" })

    references.set(id, src)
  }

  return [...references].map(([id, filename]) => ({ id, filename }))
}

function replaceDiagramReferences(content: string, duplicates: Map<number, { id: number, filename: string }>): string {
  return content.replace(DIAGRAM_TAG_PATTERN, (tag, attributes: string) => {
    const rawId = attributeValue(attributes.match(MEDIA_ID_PATTERN))
    const id = rawId ? Number(rawId) : NaN
    const duplicate = duplicates.get(id)
    if (!duplicate)
      return tag

    const nextAttributes = attributes
      .replace(MEDIA_ID_PATTERN, `media-id="${duplicate.id}"`)
      .replace(SRC_PATTERN, `src="/uploads/${duplicate.filename}"`)
    return `::diagram{${nextAttributes}}`
  })
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
      // PostgreSQL stores timestamps with microsecond precision, whereas the
      // JavaScript Date sent by the client has millisecond precision.
      .where(and(eq(pages.id, existing.id), sql`date_trunc('milliseconds', ${pages.updatedAt}) = ${existing.updatedAt.toISOString()}`))
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

export async function duplicatePage(db: Database, editor: User, sourcePath: string, input: DuplicatePageInput) {
  const createdFilenames: string[] = []

  try {
    return await db.transaction(async (tx) => {
      const [source] = await tx.select().from(pages).where(eq(pages.path, sourcePath))
      if (!source)
        throw createError({ statusCode: 404, statusMessage: "Page not found" })

      const [conflict] = await tx.select({ id: pages.id }).from(pages).where(eq(pages.path, input.path))
      if (conflict)
        throw createError({ statusCode: 409, statusMessage: "Page path already exists" })

      const references = findDiagramReferences(source.content)
      const duplicates = new Map<number, { id: number, filename: string }>()

      for (const reference of references) {
        const [original] = await tx.select().from(media).where(eq(media.id, reference.id))
        if (!original || original.kind !== "diagram" || reference.filename !== `/uploads/${original.filename}`)
          throw createError({ statusCode: 400, statusMessage: "Invalid diagram reference" })

        let data: Buffer
        try {
          data = await readFile(join(uploadDir(), original.filename))
        } catch {
          throw createError({ statusCode: 409, statusMessage: "Diagram file could not be copied" })
        }

        const filename = generateFilename("svg")
        await writeUploadAtomically(filename, data)
        createdFilenames.push(filename)

        const [duplicate] = await tx.insert(media).values({
          filename,
          originalName: original.originalName,
          mime: original.mime,
          size: data.byteLength,
          kind: "diagram",
          uploadedBy: editor.id,
        }).returning()
        if (!duplicate)
          throw new Error("Failed to duplicate diagram")

        duplicates.set(original.id, duplicate)
      }

      const [created] = await tx.insert(pages).values({
        path: input.path,
        title: input.title,
        description: source.description,
        content: replaceDiagramReferences(source.content, duplicates),
        createdBy: editor.id,
        updatedBy: editor.id,
      }).returning()
      if (!created)
        throw new Error("Failed to duplicate page")

      return created
    })
  } catch (error) {
    await Promise.all(createdFilenames.map(filename => unlink(join(uploadDir(), filename)).catch(() => {})))
    throw error
  }
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
