import { isValidPagePath, normalizePagePath } from "./page-path"

/** Returns a wiki page path when a relative href points at an internal page. */
export function internalPagePathFromHref(href: string): string | null {
  try {
    const url = new URL(href, "https://wiki.invalid")
    if (url.origin !== "https://wiki.invalid")
      return null

    if (url.pathname === "/")
      return "home"
    if (!url.pathname.startsWith("/wiki/"))
      return null

    const path = normalizePagePath(decodeURIComponent(url.pathname.slice("/wiki/".length)))
    return isValidPagePath(path) ? path : null
  } catch {
    return null
  }
}

export function isHttpsHref(href: string): boolean {
  try {
    return new URL(href).protocol === "https:"
  } catch {
    return false
  }
}
