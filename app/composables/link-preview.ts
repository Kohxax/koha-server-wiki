import type { LinkPreviewDto } from "~~/shared/types/api"
import { internalPagePathFromHref, isHttpsHref } from "~~/shared/utils/link-preview"

const OPEN_DELAY_MS = 180
const CLOSE_DELAY_MS = 120
// Popover width (w-80) plus an 8px margin from the viewport edge.
const PREVIEW_WIDTH = 336

function isPreviewableHref(href: string) {
  return internalPagePathFromHref(href) !== null || isHttpsHref(href)
}

/**
 * Hover-triggered link preview popovers for wiki content: internal wiki
 * links and external https links both resolve through the same
 * `/api/link-preview` endpoint, with results cached per href for the
 * lifetime of the component so re-hovering a link doesn't refetch.
 */
export function useLinkPreview() {
  const preview = shallowRef<LinkPreviewDto>()
  const open = ref(false)
  const position = ref({ left: 0, top: 0 })

  const previewCache = new Map<string, LinkPreviewDto>()
  const pendingPreviewRequests = new Map<string, Promise<LinkPreviewDto>>()
  let hoveredHref = ""
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

  function positionPreview(link: HTMLAnchorElement) {
    const rect = link.getBoundingClientRect()
    position.value = {
      left: Math.max(8, Math.min(rect.left, window.innerWidth - PREVIEW_WIDTH)),
      top: Math.min(rect.bottom + 8, window.innerHeight - 16),
    }
  }

  function showLinkPreview(event: Event) {
    const target = event.target
    if (!(target instanceof Element))
      return
    const link = target.closest<HTMLAnchorElement>("a[href]")
    const href = link?.getAttribute("href")
    if (!link || !href || !isPreviewableHref(href))
      return

    clearTimeout(closeTimer)
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
  })

  return {
    preview,
    open,
    position,
    showLinkPreview,
    hideLinkPreview,
    hideLinkPreviewOnFocusLeave,
  }
}
