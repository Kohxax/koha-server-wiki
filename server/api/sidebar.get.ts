import { eq } from "drizzle-orm"
import { useDb } from "../database/client"
import { pages, settings } from "../database/schema"
import type { TreeNode } from "../utils/tree"

export default defineEventHandler(async () => {
  const db = useDb()
  const [modeSetting] = await db.select().from(settings).where(eq(settings.key, "sidebar_mode"))
  const mode = modeSetting?.value === "manual" ? "manual" : "auto"

  if (mode === "manual") {
    const [treeSetting] = await db.select().from(settings).where(eq(settings.key, "sidebar_tree"))
    return { mode, tree: (treeSetting?.value as TreeNode[] | undefined) ?? [] }
  }

  const rows = await db.select({ path: pages.path, title: pages.title }).from(pages)
  return { mode, tree: buildPageTree(rows) }
})
