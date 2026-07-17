import { describe, expect, it } from "vitest"
import { replacePagePathInTree } from "./sidebar-tree"

describe("replacePagePathInTree", () => {
  it("replaces matching page paths at every nesting level", () => {
    const tree = [
      {
        label: "見出し",
        children: [
          { label: "移動するページ", path: "build/farm", children: [] },
          { label: "別ページ", path: "build/base", children: [] },
        ],
      },
    ]

    expect(replacePagePathInTree(tree, "build/farm", "guide/farm")).toEqual([
      {
        label: "見出し",
        children: [
          { label: "移動するページ", path: "guide/farm", children: [] },
          { label: "別ページ", path: "build/base", children: [] },
        ],
      },
    ])
  })
})
