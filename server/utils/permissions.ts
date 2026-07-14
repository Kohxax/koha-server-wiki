export type Role = "admin" | "editor" | "viewer"

export function canEdit(role: Role | null | undefined): boolean {
  return role === "editor" || role === "admin"
}

export function canAdmin(role: Role | null | undefined): boolean {
  return role === "admin"
}
