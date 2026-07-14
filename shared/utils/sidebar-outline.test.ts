import type { TreeNode } from "../../server/utils/tree"
import { describe, expect, it } from "vitest"
import {
  indentNode,
  moveNodeDown,
  moveNodeUp,
  outdentNode,
  outlineToTree,
  treeToOutline,
} from "./sidebar-outline"

const sampleTree: TreeNode[] = [
  {
    label: "build",
    children: [
      { label: "拠点", path: "build/base", children: [] },
      { label: "農場", path: "build/farm", children: [] },
    ],
  },
  { label: "ホーム", path: "home", children: [] },
]

describe("treeToOutline / outlineToTree round-trip", () => {
  it("converts a nested tree to a flat outline and back losslessly", () => {
    const outline = treeToOutline(sampleTree)
    expect(outline.map(o => ({ label: o.label, path: o.path, level: o.level }))).toEqual([
      { label: "build", path: undefined, level: 0 },
      { label: "拠点", path: "build/base", level: 1 },
      { label: "農場", path: "build/farm", level: 1 },
      { label: "ホーム", path: "home", level: 0 },
    ])

    expect(outlineToTree(outline)).toEqual(sampleTree)
  })

  it("handles an empty tree", () => {
    expect(treeToOutline([])).toEqual([])
    expect(outlineToTree([])).toEqual([])
  })
})

describe("indentNode / outdentNode", () => {
  it("indents a top-level node under the previous one, bringing its subtree along", () => {
    const outline = treeToOutline(sampleTree)
    // indent "ホーム" (last item, level 0) under "build"
    const indexOfHome = outline.findIndex(o => o.label === "ホーム")
    const result = indentNode(outline, indexOfHome)
    expect(result[indexOfHome]!.level).toBe(1)
  })

  it("refuses to indent past the previous line's level + 1", () => {
    const outline = treeToOutline(sampleTree)
    // "拠点" is already at level 1 (child of build); indenting it further would need
    // a preceding level-1 sibling, but the preceding row ("build") is level 0.
    const indexOfBase = outline.findIndex(o => o.label === "拠点")
    const result = indentNode(outline, indexOfBase)
    expect(result[indexOfBase]!.level).toBe(1)
  })

  it("does not indent the very first row", () => {
    const outline = treeToOutline(sampleTree)
    const result = indentNode(outline, 0)
    expect(result).toEqual(outline)
  })

  it("outdents a node and its subtree by one level", () => {
    const outline = treeToOutline(sampleTree)
    const indexOfBuild = outline.findIndex(o => o.label === "build")
    const result = outdentNode(outline, indexOfBuild)
    // build (0) and its two children should all move up one level conceptually,
    // but since build was already level 0, outdent is a no-op
    expect(result).toEqual(outline)

    const indexOfBase = outline.findIndex(o => o.label === "拠点")
    const outdented = outdentNode(outline, indexOfBase)
    expect(outdented[indexOfBase]!.level).toBe(0)
  })
})

describe("moveNodeUp / moveNodeDown", () => {
  it("moves a top-level node (with its subtree) above the previous sibling", () => {
    const outline = treeToOutline(sampleTree)
    const indexOfHome = outline.findIndex(o => o.label === "ホーム")
    const moved = moveNodeUp(outline, indexOfHome)
    expect(moved.map(o => o.label)).toEqual(["ホーム", "build", "拠点", "農場"])
  })

  it("moves a whole subtree block together, not just one row", () => {
    const outline = treeToOutline(sampleTree)
    const moved = moveNodeUp(outline, 3) // "ホーム" at index 3
    // "build" and its two children move down as a unit, staying together
    const buildIndex = moved.findIndex(o => o.label === "build")
    expect(moved[buildIndex + 1]!.label).toBe("拠点")
    expect(moved[buildIndex + 2]!.label).toBe("農場")
  })

  it("does nothing when moving the first node up", () => {
    const outline = treeToOutline(sampleTree)
    expect(moveNodeUp(outline, 0)).toEqual(outline)
  })

  it("moves a node down past its next sibling", () => {
    const outline = treeToOutline(sampleTree)
    const indexOfBuild = outline.findIndex(o => o.label === "build")
    const moved = moveNodeDown(outline, indexOfBuild)
    expect(moved.map(o => o.label)).toEqual(["ホーム", "build", "拠点", "農場"])
  })

  it("does nothing when moving the last node down", () => {
    const outline = treeToOutline(sampleTree)
    const indexOfHome = outline.findIndex(o => o.label === "ホーム")
    expect(moveNodeDown(outline, indexOfHome)).toEqual(outline)
  })

  it("cannot move a child node past its parent's siblings (only reorders within same level)", () => {
    const outline = treeToOutline(sampleTree)
    const indexOfBase = outline.findIndex(o => o.label === "拠点")
    const moved = moveNodeUp(outline, indexOfBase)
    // 拠点 has no previous sibling at level 1 (build is level 0), so no-op
    expect(moved).toEqual(outline)
  })
})
