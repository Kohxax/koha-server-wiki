function markdownToPlainText(content: string): string {
  return content
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/!\[([^\]]*)\]\[[^\]]*\]/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/<https?:\/\/[^>]+>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}(?:[-*+] |\d+[.)] )/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[|*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function buildExcerpt(content: string, query: string, radius = 40): string {
  const plain = markdownToPlainText(content)

  if (!query)
    return plain.slice(0, radius * 2)

  const idx = plain.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1)
    return plain.slice(0, radius * 2) + (plain.length > radius * 2 ? "…" : "")

  const start = Math.max(0, idx - radius)
  const end = Math.min(plain.length, idx + query.length + radius)
  const prefix = start > 0 ? "…" : ""
  const suffix = end < plain.length ? "…" : ""
  return prefix + plain.slice(start, end) + suffix
}
