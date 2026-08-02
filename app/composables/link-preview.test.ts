import { describe, expect, it } from "vitest"
import { calculateLinkPreviewPosition } from "../lib/link-preview-position"

describe("calculateLinkPreviewPosition", () => {
  const viewport = { viewportWidth: 1280, viewportHeight: 800, previewHeight: 280 }

  it("places the preview below a link when there is enough room", () => {
    expect(calculateLinkPreviewPosition({
      ...viewport,
      anchor: { left: 120, top: 160, right: 200, bottom: 180 },
    })).toEqual({ left: 120, top: 188, placement: "below" })
  })

  it("places the preview above a link near the bottom of the viewport", () => {
    expect(calculateLinkPreviewPosition({
      ...viewport,
      anchor: { left: 120, top: 700, right: 200, bottom: 720 },
    })).toEqual({ left: 120, top: 412, placement: "above" })
  })

  it("keeps the preview inside the horizontal viewport bounds", () => {
    expect(calculateLinkPreviewPosition({
      ...viewport,
      anchor: { left: 1260, top: 160, right: 1280, bottom: 180 },
    }).left).toBe(952)
  })
})
