import { z } from "zod"

const PATH_CHARS = "a-zA-Z0-9_\\-ぁ-んァ-ヶ一-龠ー"
const PAGE_PATH_REGEX = new RegExp(`^[${PATH_CHARS}]+(?:/[${PATH_CHARS}]+)*$`)

export function normalizePagePath(raw: string): string {
  return raw
    .trim()
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
}

export function isValidPagePath(path: string): boolean {
  return path.length > 0 && PAGE_PATH_REGEX.test(path)
}

export const pagePathSchema = z.string()
  .transform(normalizePagePath)
  .refine(isValidPagePath, { message: "無効なページパスです" })
