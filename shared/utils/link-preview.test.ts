import { describe, expect, it } from "vitest"
import { internalPagePathFromHref, isHttpsHref } from "./link-preview"

describe("internalPagePathFromHref", () => {
  it("recognizes home and valid wiki page links", () => {
    expect(internalPagePathFromHref("/")).toBe("home")
    expect(internalPagePathFromHref("/wiki/攻略/始め方#intro")).toBe("攻略/始め方")
  })

  it("recognizes same-origin absolute wiki page links", () => {
    expect(internalPagePathFromHref("https://wiki.bokukoha.dev/wiki/攻略/始め方#intro", "https://wiki.bokukoha.dev")).toBe("攻略/始め方")
    expect(internalPagePathFromHref("http://localhost:3000/wiki/guide", "http://localhost:3000/")).toBe("guide")
  })

  it("does not treat external or invalid links as internal", () => {
    expect(internalPagePathFromHref("https://example.com/wiki/guide")).toBeNull()
    expect(internalPagePathFromHref("https://example.com/wiki/guide", "https://wiki.bokukoha.dev")).toBeNull()
    expect(internalPagePathFromHref("/wiki/../../secret")).toBeNull()
  })
})

describe("isHttpsHref", () => {
  it("allows only absolute HTTPS URLs", () => {
    expect(isHttpsHref("https://example.com/guide")).toBe(true)
    expect(isHttpsHref("http://example.com/guide")).toBe(false)
    expect(isHttpsHref("/wiki/guide")).toBe(false)
  })
})
