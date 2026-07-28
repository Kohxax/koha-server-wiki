import type { Component } from "vue"
import type { Role } from "~~/shared/types/api"
import { FolderCogIcon, ImageIcon, LayoutDashboardIcon, UsersIcon, WaypointsIcon } from "@lucide/vue"

export type SettingsRole = Role

export interface SettingsMenuItem {
  id: string
  label: string
  description: string
  to: string
  icon: Component
  minimumRole: "editor" | "admin"
}

// Add future settings here. Navigation and the dashboard both read this registry.
export const settingsMenu: SettingsMenuItem[] = [
  { id: "overview", label: "管理ダッシュボード", description: "サイトの状況を確認", to: "/settings", icon: LayoutDashboardIcon, minimumRole: "editor" },
  { id: "pages", label: "ページ管理", description: "ページの閲覧・編集・削除", to: "/settings/pages", icon: WaypointsIcon, minimumRole: "editor" },
  { id: "sidebar", label: "サイドバー管理", description: "表示するページと見出しを設定", to: "/settings/sidebar", icon: FolderCogIcon, minimumRole: "editor" },
  { id: "media", label: "メディア管理", description: "アップロード済みファイルを管理", to: "/settings/media", icon: ImageIcon, minimumRole: "editor" },
  { id: "users", label: "ユーザー管理", description: "ユーザー権限を管理", to: "/settings/users", icon: UsersIcon, minimumRole: "admin" },
]

export function visibleSettingsMenu(role?: SettingsRole) {
  return settingsMenu.filter(item => item.minimumRole === "editor"
    ? role === "editor" || role === "admin"
    : role === "admin")
}
