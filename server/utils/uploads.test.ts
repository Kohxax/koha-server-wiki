import { describe, expect, it } from "vitest"
import { extToMime, isAllowedMime, isSafeSvg } from "./uploads"

describe("isAllowedMime", () => {
  it("accepts image mime types", () => {
    expect(isAllowedMime("image/png")).toBe(true)
    expect(isAllowedMime("image/jpeg")).toBe(true)
    expect(isAllowedMime("image/webp")).toBe(true)
    expect(isAllowedMime("image/gif")).toBe(true)
    expect(isAllowedMime("image/svg+xml")).toBe(true)
  })

  it("rejects non-image mime types", () => {
    expect(isAllowedMime("application/pdf")).toBe(false)
    expect(isAllowedMime("text/html")).toBe(false)
    expect(isAllowedMime("application/javascript")).toBe(false)
  })
})

describe("isSafeSvg", () => {
  it("accepts a plain svg", () => {
    expect(isSafeSvg("<svg xmlns=\"http://www.w3.org/2000/svg\"><rect /></svg>")).toBe(true)
  })

  it("rejects svg containing script tags", () => {
    expect(isSafeSvg("<svg><script>alert(1)</script></svg>")).toBe(false)
  })

  it("rejects svg containing event handler attributes", () => {
    expect(isSafeSvg("<svg onload=\"alert(1)\"><rect /></svg>")).toBe(false)
  })

  it("rejects svg with javascript: href", () => {
    expect(isSafeSvg("<svg><a xlink:href=\"javascript:alert(1)\">x</a></svg>")).toBe(false)
  })

  it("accepts draw.io's embedded content attribute (regression: must not match 'on' inside 'content=')", () => {
    expect(isSafeSvg("<svg width=\"100\" height=\"100\" content=\"&lt;mxfile&gt;v1&lt;/mxfile&gt;\"><rect/></svg>")).toBe(true)
  })

  it("allows draw.io labels with foreignObject only for diagrams", () => {
    const svg = "<svg><foreignObject><div>ラベル</div></foreignObject></svg>"
    expect(isSafeSvg(svg)).toBe(false)
    expect(isSafeSvg(svg, { allowForeignObject: true })).toBe(true)
  })

  it("rejects executable content even when foreignObject is allowed", () => {
    expect(isSafeSvg("<svg><foreignObject onload=\"alert(1)\" /></svg>", { allowForeignObject: true })).toBe(false)
    expect(isSafeSvg("<svg><foreignObject><iframe src=\"https://example.com\" /></foreignObject></svg>", { allowForeignObject: true })).toBe(false)
  })
})

describe("extToMime", () => {
  it("maps known extensions back to mime types", () => {
    expect(extToMime("png")).toBe("image/png")
    expect(extToMime("webp")).toBe("image/webp")
    expect(extToMime("gif")).toBe("image/gif")
    expect(extToMime("svg")).toBe("image/svg+xml")
  })

  it("falls back to octet-stream for unknown extensions", () => {
    expect(extToMime("exe")).toBe("application/octet-stream")
  })
})
