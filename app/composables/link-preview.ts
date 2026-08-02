import type { InjectionKey } from "vue"
import {
  calculateLinkPreviewPosition,
  DEFAULT_PREVIEW_HEIGHT,
  type LinkPreviewPosition,
  type LinkPreviewRect,
} from "~/lib/link-preview-position"
import type { LinkPreviewDto } from "~~/shared/types/api"
import { internalPagePathFromHref, isHttpsHref } from "~~/shared/utils/link-preview"

const OPEN_DELAY_MS = 180
const CLOSE_DELAY_MS = 120

export interface LinkPreviewContext {
  showLinkPreview: (source: Event | Element, getRect?: () => LinkPreviewRect) => void
  hideLinkPreview: () => void
}

const linkPreviewKey: InjectionKey<LinkPreviewContext> = Symbol("link-preview")

export function provideLinkPreview(context: LinkPreviewContext) {
  provide(linkPreviewKey, context)
}

export function useLinkPreviewContext(): LinkPreviewContext | null {
  return inject(linkPreviewKey, null)
}

function isPreviewableHref(href: string, siteOrigin: string) {
  return internalPagePathFromHref(href, siteOrigin) !== null || isHttpsHref(href)
}

function asElement(value: unknown): Element | null {
  if (!value || typeof value !== "object")
    return null

  const candidate = value as { closest?: unknown, getAttribute?: unknown }
  return typeof candidate.closest === "function" && typeof candidate.getAttribute === "function"
    ? value as Element
    : null
}

function linkFromSource(source: Event | Element): Element | null {
  const target = asElement(source) ?? asElement((source as Event).target)
  return target?.closest("a") ?? null
}

function hrefFromLink(link: Element): string | null {
  return link.getAttribute("href")
    || link.getAttribute("xlink:href")
    || link.getAttributeNS("http://www.w3.org/1999/xlink", "href")
    || null
}

/**
 * Hover-triggered link preview popovers for wiki content: internal wiki
 * links and external https links both resolve through the same
 * `/api/link-preview` endpoint, with results cached per href for the
 * lifetime of the component so re-hovering a link doesn't refetch.
 */
export function useLinkPreview() {
  const siteOrigin = useSiteOrigin()
  const preview = shallowRef<LinkPreviewDto>()
  const open = ref(false)
  const position = ref<LinkPreviewPosition>({ left: 0, top: 0, placement: "below" })

  const previewCache = new Map<string, LinkPreviewDto>()
  const pendingPreviewRequests = new Map<string, Promise<LinkPreviewDto>>()
  let hoveredHref = ""
  let hoveredLink: Element | undefined
  let hoveredRectGetter: (() => LinkPreviewRect) | undefined
  let previewHeight = DEFAULT_PREVIEW_HEIGHT
  let openTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined

  async function getLinkPreview(href: string): Promise<LinkPreviewDto> {
    const cached = previewCache.get(href)
    if (cached)
      return cached
    const pending = pendingPreviewRequests.get(href)
    if (pending)
      return await pending

    const request = $fetch<LinkPreviewDto>("/api/link-preview", { query: { href } })
    pendingPreviewRequests.set(href, request)
    try {
      const result = await request
      previewCache.set(href, result)
      return result
    } finally {
      pendingPreviewRequests.delete(href)
    }
  }

  function positionPreview(link: Element, getRect = hoveredRectGetter) {
    const rect = getRect?.() ?? link.getBoundingClientRect()
    position.value = calculateLinkPreviewPosition({
      anchor: rect,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      previewHeight,
    })
  }

  function showLinkPreview(source: Event | Element, getRect?: () => LinkPreviewRect) {
    const link = linkFromSource(source)
    const href = link && hrefFromLink(link)
    if (!link || !href || !isPreviewableHref(href, siteOrigin.value))
      return

    clearTimeout(closeTimer)
    hoveredLink = link
    hoveredRectGetter = getRect
    positionPreview(link)
    if (open.value && hoveredHref === href)
      return

    clearTimeout(openTimer)
    hoveredHref = href
    preview.value = undefined
    openTimer = setTimeout(() => {
      open.value = true
      void getLinkPreview(href)
        .then((value) => {
          if (hoveredHref === href)
            preview.value = value
        })
        .catch(() => {
          if (hoveredHref === href)
            open.value = false
        })
    }, OPEN_DELAY_MS)
  }

  function hideLinkPreview() {
    clearTimeout(openTimer)
    closeTimer = setTimeout(() => {
      open.value = false
      preview.value = undefined
      hoveredHref = ""
      hoveredLink = undefined
      hoveredRectGetter = undefined
    }, CLOSE_DELAY_MS)
  }

  function hideLinkPreviewOnFocusLeave() {
    setTimeout(() => {
      if (!document.activeElement?.closest("article[data-image-viewer-group]"))
        hideLinkPreview()
    })
  }

  onBeforeUnmount(() => {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    window.removeEventListener("resize", repositionPreview)
    window.removeEventListener("scroll", repositionPreview, true)
  })

  function repositionPreview() {
    if (hoveredLink && open.value)
      positionPreview(hoveredLink)
  }

  function updatePreviewCardSize(height: number) {
    if (!Number.isFinite(height) || height <= 0)
      return
    previewHeight = height
    if (hoveredLink && open.value)
      positionPreview(hoveredLink)
  }

  onMounted(() => {
    window.addEventListener("resize", repositionPreview)
    window.addEventListener("scroll", repositionPreview, true)
  })

  return {
    preview,
    open,
    position,
    showLinkPreview,
    hideLinkPreview,
    hideLinkPreviewOnFocusLeave,
    updatePreviewCardSize,
  }
}
