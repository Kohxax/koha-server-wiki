export function wikiPageUrl(path: string): string {
  return path === "home" ? "/" : `/wiki/${path}`
}
