import type { TreeNode } from "../../shared/types/api"

interface TreeBuilderNode {
  segment: string
  fullPath: string
  children: Map<string, TreeBuilderNode>
  isPage: boolean
}

function sortNodes(nodes: TreeNode[]) {
  nodes.sort((a, b) => a.label.localeCompare(b.label, "ja"))
  for (const node of nodes) sortNodes(node.children)
}

function toTreeNode(node: TreeBuilderNode, titleByPath: Map<string, string>): TreeNode {
  return {
    label: titleByPath.get(node.fullPath) ?? node.segment,
    path: node.isPage ? node.fullPath : undefined,
    children: [...node.children.values()].map(child => toTreeNode(child, titleByPath)),
  }
}

export function buildPageTree(pages: { path: string, title: string }[]): TreeNode[] {
  const root: TreeBuilderNode = { segment: "", fullPath: "", children: new Map(), isPage: false }
  const titleByPath = new Map(pages.map(page => [page.path, page.title]))

  for (const page of pages) {
    const segments = page.path.split("/").filter(Boolean)
    let current = root
    let accumulated = ""

    for (const segment of segments) {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment
      let child = current.children.get(segment)
      if (!child) {
        child = { segment, fullPath: accumulated, children: new Map(), isPage: false }
        current.children.set(segment, child)
      }
      current = child
    }

    current.isPage = true
  }

  const tree = [...root.children.values()].map(child => toTreeNode(child, titleByPath))
  sortNodes(tree)
  return tree
}
