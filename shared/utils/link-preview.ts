import { isValidPagePath, normalizePagePath } from "./page-path"

const RELATIVE_HREF_ORIGIN = "https://wiki.invalid"

/** Returns a wiki page path when href points at an internal page. */
export function internalPagePathFromHref(href: string, siteOrigin?: string): string | null {
  try {
    const expectedOrigin = siteOrigin ? new URL(siteOrigin).origin : RELATIVE_HREF_ORIGIN
    const url = new URL(href, `${expectedOrigin}/`)
    if (url.origin !== expectedOrigin)
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
