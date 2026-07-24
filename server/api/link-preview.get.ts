import { eq } from "drizzle-orm"
import type { LinkPreviewDto } from "../../shared/types/api"
import { internalPagePathFromHref, isHttpsHref } from "../../shared/utils/link-preview"
import { useDb } from "../database/client"
import { pages } from "../database/schema"
import { getExternalLinkPreview } from "../utils/link-preview"

function firstArticleImage(content: string): string | null {
  const match = content.match(/!\[[^\]]*]\(\s*(\/uploads\/[^\s)]+)(?:\s+['"][^)]*['"])?\s*\)/)
  return match?.[1] ?? null
}

export default defineEventHandler(async (event): Promise<LinkPreviewDto> => {
  const href = getQuery(event).href
  if (typeof href !== "string" || !href.trim())
    throw createError({ statusCode: 400, statusMessage: "A link is required" })

  const internalPath = internalPagePathFromHref(href)
  if (internalPath) {
    const [page] = await useDb().select({
      title: pages.title,
      description: pages.description,
      content: pages.content,
      updatedAt: pages.updatedAt,
    }).from(pages).where(eq(pages.path, internalPath))
    if (!page)
      throw createError({ statusCode: 404, statusMessage: "Page not found" })

    return {
      type: "internal",
      title: page.title,
      description: page.description,
      imageUrl: firstArticleImage(page.content),
      siteName: null,
      updatedAt: page.updatedAt.toISOString(),
    }
  }

  if (!isHttpsHref(href))
    throw createError({ statusCode: 400, statusMessage: "Only internal or HTTPS links are supported" })

  try {
    const preview = await getExternalLinkPreview(href)
    return { type: "external", ...preview, updatedAt: null }
  } catch (error) {
    console.warn("Failed to retrieve external link preview", {
      href,
      reason: error instanceof Error ? error.message : "Unknown error",
    })
    throw createError({ statusCode: 422, statusMessage: "Link preview is unavailable" })
  }
})
