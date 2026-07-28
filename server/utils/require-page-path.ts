import type { H3Event } from "h3"
import { createError, getRouterParam } from "h3"

/** Reads, normalizes, and validates the `path` route param, or throws a 400. */
export function requirePagePath(event: H3Event): string {
  const raw = getRouterParam(event, "path") ?? ""
  const path = normalizePagePath(raw)
  if (!isValidPagePath(path))
    throw createError({ statusCode: 400, statusMessage: "Invalid page path" })

  return path
}
