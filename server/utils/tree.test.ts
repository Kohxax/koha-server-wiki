import { describe, expect, it } from "vitest"
import { buildPageTree } from "./tree"

describe("buildPageTree", () => {
  it("builds a nested tree from flat paths", () => {
    const tree = buildPageTree([
      { path: "home", title: "ホーム" },
      { path: "build/base", title: "拠点" },
      { path: "build/farm", title: "農場" },
    ])

    expect(tree).toHaveLength(2)

    const buildNode = tree.find(n => n.children.length > 0)
    expect(buildNode).toBeDefined()
    expect(buildNode?.path).toBeUndefined()
    expect(buildNode?.children.map(c => c.label).sort()).toEqual(["拠点", "農場"])

    const homeNode = tree.find(n => n.path === "home")
    expect(homeNode?.label).toBe("ホーム")
  })

  it("marks intermediate folders without their own page as pathless", () => {
    const tree = buildPageTree([{ path: "a/b/c", title: "C" }])
    expect(tree[0].path).toBeUndefined()
    expect(tree[0].children[0].path).toBeUndefined()
    expect(tree[0].children[0].children[0].path).toBe("a/b/c")
  })

  it("supports a folder segment that is itself a page", () => {
    const tree = buildPageTree([
      { path: "build", title: "建築" },
      { path: "build/base", title: "拠点" },
    ])

    const buildNode = tree.find(n => n.label === "建築")
    expect(buildNode?.path).toBe("build")
    expect(buildNode?.children[0].path).toBe("build/base")
  })

  it("sorts children by label", () => {
    const tree = buildPageTree([
      { path: "b", title: "b" },
      { path: "a", title: "a" },
    ])
    expect(tree.map(n => n.label)).toEqual(["a", "b"])
  })
})
