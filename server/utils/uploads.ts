import { randomUUID } from "node:crypto"
import { mkdirSync } from "node:fs"
import { rename, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"

export const MAX_UPLOAD_SIZE = 20 * 1024 * 1024

export const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
}

export function uploadDir(): string {
  const dir = useRuntimeConfig().uploadDir
  mkdirSync(dir, { recursive: true })
  return dir
}

export function generateFilename(ext: string): string {
  return `${randomUUID()}.${ext}`
}

export function isAllowedMime(mime: string): boolean {
  return mime in ALLOWED_MIME_TO_EXT
}

const SVG_DANGEROUS_PATTERN = /<script|\bon\w+\s*=|(?:xlink:)?href\s*=\s*["']?\s*(?:javascript:|data:text\/html)|<(?:iframe|object|embed)\b/i

export function isSafeSvg(content: string, { allowForeignObject = false } = {}): boolean {
  return !SVG_DANGEROUS_PATTERN.test(content)
    && (allowForeignObject || !/<foreignobject\b/i.test(content))
}

export function extToMime(ext: string): string {
  const found = Object.entries(ALLOWED_MIME_TO_EXT).find(([, value]) => value === ext)
  return found?.[0] ?? "application/octet-stream"
}

export async function writeUploadAtomically(filename: string, data: Buffer): Promise<void> {
  const dir = uploadDir()
  const temporaryPath = join(dir, `.${filename}.${randomUUID()}.tmp`)
  try {
    await writeFile(temporaryPath, data, { flag: "wx" })
    await rename(temporaryPath, join(dir, filename))
  } finally {
    await rm(temporaryPath, { force: true })
  }
}
