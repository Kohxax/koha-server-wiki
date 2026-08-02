export const DEFAULT_PREVIEW_HEIGHT = 280

const PREVIEW_WIDTH = 320
const VIEWPORT_PADDING = 8
const PREVIEW_GAP = 8

export interface LinkPreviewRect {
  left: number
  top: number
  right: number
  bottom: number
}

export interface LinkPreviewPosition {
  left: number
  top: number
  placement: "above" | "below"
}

export function calculateLinkPreviewPosition({
  anchor,
  viewportWidth,
  viewportHeight,
  previewWidth = PREVIEW_WIDTH,
  previewHeight = DEFAULT_PREVIEW_HEIGHT,
}: {
  anchor: LinkPreviewRect
  viewportWidth: number
  viewportHeight: number
  previewWidth?: number
  previewHeight?: number
}): LinkPreviewPosition {
  const width = Math.min(previewWidth, Math.max(0, viewportWidth - VIEWPORT_PADDING * 2))
  const left = Math.min(
    Math.max(VIEWPORT_PADDING, anchor.left),
    Math.max(VIEWPORT_PADDING, viewportWidth - width - VIEWPORT_PADDING),
  )
  const maxTop = Math.max(VIEWPORT_PADDING, viewportHeight - previewHeight - VIEWPORT_PADDING)
  const belowTop = anchor.bottom + PREVIEW_GAP
  const aboveTop = anchor.top - PREVIEW_GAP - previewHeight
  const hasRoomBelow = belowTop + previewHeight <= viewportHeight - VIEWPORT_PADDING
  const hasRoomAbove = aboveTop >= VIEWPORT_PADDING
  const placement = !hasRoomBelow && hasRoomAbove ? "above" : "below"
  const rawTop = placement === "above" ? aboveTop : belowTop

  return {
    left,
    top: Math.min(Math.max(VIEWPORT_PADDING, rawTop), maxTop),
    placement,
  }
}
