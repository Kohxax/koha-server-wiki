import type { TreeNode } from "./tree"

export function replacePagePathInTree(nodes: TreeNode[], previousPath: string, nextPath: string): TreeNode[] {
  return nodes.map(node => ({
    ...node,
    path: node.path === previousPath ? nextPath : node.path,
    children: replacePagePathInTree(node.children, previousPath, nextPath),
  }))
}
