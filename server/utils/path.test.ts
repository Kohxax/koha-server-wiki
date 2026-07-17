import { describe, expect, it } from "vitest"
import { isValidPagePath, normalizePagePath } from "../../shared/utils/page-path"

describe("normalizePagePath", () => {
  it("trims surrounding whitespace and slashes", () => {
    expect(normalizePagePath("  /build/hoge/  ")).toBe("build/hoge")
  })

  it("collapses consecutive slashes", () => {
    expect(normalizePagePath("build//hoge///fuga")).toBe("build/hoge/fuga")
  })

  it("keeps a single segment path as-is", () => {
    expect(normalizePagePath("home")).toBe("home")
  })
})

describe("isValidPagePath", () => {
  it("accepts alphanumeric, underscore, hyphen and japanese segments", () => {
    expect(isValidPagePath("build/hoge_fuga-123")).toBe(true)
    expect(isValidPagePath("建築/ホーム")).toBe(true)
    expect(isValidPagePath("home")).toBe(true)
  })

  it("rejects empty path", () => {
    expect(isValidPagePath("")).toBe(false)
  })

  it("rejects disallowed characters", () => {
    expect(isValidPagePath("build/../etc")).toBe(false)
    expect(isValidPagePath("build hoge")).toBe(false)
    expect(isValidPagePath("build?x=1")).toBe(false)
    expect(isValidPagePath("build/<script>")).toBe(false)
  })
})
