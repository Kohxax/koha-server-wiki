import type { TreeNode } from "../types/api"
import type { SidebarIconName } from "./sidebar-icons"

export interface OutlineNode {
  id: string
  label: string
  path?: string
  icon?: SidebarIconName
  level: number
}

export function treeToOutline(nodes: TreeNode[]): OutlineNode[] {
  const result: OutlineNode[] = []
  let counter = 0

  function walk(list: TreeNode[], level: number) {
    for (const node of list) {
      result.push({ id: `n${counter++}`, label: node.label, path: node.path, icon: node.icon, level })
      walk(node.children, level + 1)
    }
  }

  walk(nodes, 0)
  return result
}

export function outlineToTree(outline: OutlineNode[]): TreeNode[] {
  const root: TreeNode[] = []
  const stack: { level: number, children: TreeNode[] }[] = [{ level: -1, children: root }]

  for (const item of outline) {
    while (stack.length > 1 && stack[stack.length - 1]!.level >= item.level)
      stack.pop()

    const parent = stack[stack.length - 1]!
    const node: TreeNode = { label: item.label, path: item.path, icon: item.icon, children: [] }
    parent.children.push(node)
    stack.push({ level: item.level, children: node.children })
  }

  return root
}

function subtreeRange(outline: OutlineNode[], index: number): [number, number] {
  const level = outline[index]!.level
  let end = index + 1
  while (end < outline.length && outline[end]!.level > level) end++
  return [index, end]
}

export function indentNode(outline: OutlineNode[], index: number): OutlineNode[] {
  const [start, end] = subtreeRange(outline, index)
  if (start === 0)
    return outline
  const maxLevel = outline[start - 1]!.level + 1
  if (outline[start]!.level >= maxLevel)
    return outline

  return outline.map((item, i) => (i >= start && i < end ? { ...item, level: item.level + 1 } : item))
}

export function outdentNode(outline: OutlineNode[], index: number): OutlineNode[] {
  const [start, end] = subtreeRange(outline, index)
  if (outline[start]!.level === 0)
    return outline

  return outline.map((item, i) => (i >= start && i < end ? { ...item, level: item.level - 1 } : item))
}

export function moveNodeUp(outline: OutlineNode[], index: number): OutlineNode[] {
  const [start, end] = subtreeRange(outline, index)
  const level = outline[start]!.level

  let prevStart = start
  while (prevStart > 0 && outline[prevStart - 1]!.level >= level) prevStart--
  if (prevStart === start || outline[prevStart]!.level !== level)
    return outline

  const before = outline.slice(0, prevStart)
  const prevBlock = outline.slice(prevStart, start)
  const currentBlock = outline.slice(start, end)
  const after = outline.slice(end)
  return [...before, ...currentBlock, ...prevBlock, ...after]
}

export function moveNodeDown(outline: OutlineNode[], index: number): OutlineNode[] {
  const [start, end] = subtreeRange(outline, index)
  const level = outline[start]!.level

  if (end >= outline.length || outline[end]!.level !== level)
    return outline

  let nextEnd = end + 1
  while (nextEnd < outline.length && outline[nextEnd]!.level > level) nextEnd++

  const before = outline.slice(0, start)
  const currentBlock = outline.slice(start, end)
  const nextBlock = outline.slice(end, nextEnd)
  const after = outline.slice(nextEnd)
  return [...before, ...nextBlock, ...currentBlock, ...after]
}
