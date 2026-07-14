import { randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import process from "node:process"
import { resolve } from "node:path"

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

export const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
}

export function uploadDir(): string {
  const dir = resolve(process.cwd(), process.env.UPLOAD_DIR ?? "uploads")
  mkdirSync(dir, { recursive: true })
  return dir
}

export function generateFilename(ext: string): string {
  return `${randomUUID()}.${ext}`
}

export function isAllowedMime(mime: string): boolean {
  return mime in ALLOWED_MIME_TO_EXT
}

const SVG_DANGEROUS_PATTERN = /<script|on\w+\s*=|xlink:href\s*=\s*["']?\s*javascript:|<foreignobject/i

export function isSafeSvg(content: string): boolean {
  return !SVG_DANGEROUS_PATTERN.test(content)
}

export function extToMime(ext: string): string {
  const found = Object.entries(ALLOWED_MIME_TO_EXT).find(([, value]) => value === ext)
  return found?.[0] ?? "application/octet-stream"
}
