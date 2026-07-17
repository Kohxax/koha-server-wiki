import type { Role } from "../types/api"

export function canEdit(role: Role | null | undefined): boolean {
  return role === "editor" || role === "admin"
}

export function canAdmin(role: Role | null | undefined): boolean {
  return role === "admin"
}
