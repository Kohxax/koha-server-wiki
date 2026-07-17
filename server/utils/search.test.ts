import { describe, expect, it } from "vitest"
import { buildExcerpt } from "./search"

describe("buildExcerpt", () => {
  it("strips basic markdown syntax and collapses whitespace", () => {
    expect(buildExcerpt("# 見出し\n\n**太字**の本文です", "本文")).toContain("本文")
    expect(buildExcerpt("# 見出し\n\n**太字**の本文です", "本文")).not.toContain("#")
    expect(buildExcerpt("# 見出し\n\n**太字**の本文です", "本文")).not.toContain("**")
  })

  it("keeps readable labels while removing image, link, and HTML markup", () => {
    const excerpt = buildExcerpt(
      '![拠点の画像](/uploads/base.png)\n[攻略ガイド](/wiki/guide)\n<div>HTMLの説明</div>',
      "攻略",
    )

    expect(excerpt).toContain("拠点の画像")
    expect(excerpt).toContain("攻略ガイド")
    expect(excerpt).toContain("HTMLの説明")
    expect(excerpt).not.toContain("/uploads/base.png")
    expect(excerpt).not.toContain("/wiki/guide")
    expect(excerpt).not.toContain("![")
    expect(excerpt).not.toContain("<div>")
  })

  it("centers the excerpt around the matched query", () => {
    const content = `${"あ".repeat(60)}拠点の説明${"い".repeat(60)}`
    const excerpt = buildExcerpt(content, "拠点", 10)
    expect(excerpt).toContain("拠点の説明")
    expect(excerpt.startsWith("…")).toBe(true)
    expect(excerpt.endsWith("…")).toBe(true)
    expect(excerpt.length).toBeLessThan(content.length)
  })

  it("is case-insensitive", () => {
    expect(buildExcerpt("Hello World", "world")).toContain("World")
  })

  it("falls back to the start of the content when the query is not found in it", () => {
    const excerpt = buildExcerpt("最初の文章がここにあります", "存在しない単語")
    expect(excerpt).toContain("最初の文章")
  })
})
