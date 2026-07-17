import type { Role } from "~~/shared/types/api"

export type SettingsRole = Role
export type SettingsIcon = "dashboard" | "pages" | "sidebar" | "media" | "users"

export interface SettingsMenuItem {
  id: string
  label: string
  description: string
  to: string
  icon: SettingsIcon
  minimumRole: "editor" | "admin"
}

// Add future settings here. Navigation and the dashboard both read this registry.
export const settingsMenu: SettingsMenuItem[] = [
  { id: "overview", label: "管理ダッシュボード", description: "サイトの状況を確認", to: "/settings", icon: "dashboard", minimumRole: "editor" },
  { id: "pages", label: "ページ管理", description: "ページの閲覧・編集・削除", to: "/settings/pages", icon: "pages", minimumRole: "editor" },
  { id: "sidebar", label: "サイドバー管理", description: "表示するページと見出しを設定", to: "/settings/sidebar", icon: "sidebar", minimumRole: "editor" },
  { id: "media", label: "メディア管理", description: "アップロード済みファイルを管理", to: "/settings/media", icon: "media", minimumRole: "editor" },
  { id: "users", label: "ユーザー管理", description: "ユーザー権限を管理", to: "/settings/users", icon: "users", minimumRole: "admin" },
]

export function visibleSettingsMenu(role?: SettingsRole) {
  return settingsMenu.filter(item => item.minimumRole === "editor"
    ? role === "editor" || role === "admin"
    : role === "admin")
}
