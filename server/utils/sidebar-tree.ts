import type { TreeNode } from "../../shared/types/api"

export function replacePagePathInTree(nodes: TreeNode[], previousPath: string, nextPath: string): TreeNode[] {
  return nodes.map(node => ({
    ...node,
    path: node.path === previousPath ? nextPath : node.path,
    children: replacePagePathInTree(node.children, previousPath, nextPath),
  }))
}

export function removePagePathFromTree(nodes: TreeNode[], path: string): TreeNode[] {
  return nodes.flatMap((node) => {
    const children = removePagePathFromTree(node.children, path)
    if (node.path !== path)
      return [{ ...node, children }]
    return children.length ? [{ ...node, path: undefined, children }] : children
  })
}
