import type { SidebarIconName } from "../utils/sidebar-icons"

export type Role = "admin" | "editor" | "viewer"
export type MediaKind = "image" | "diagram"

export interface UserDto {
  id: number
  discordId: string
  username: string
  avatarUrl: string | null
  role: Role
  createdAt: string
}

export interface PageDto {
  id: number
  path: string
  title: string
  description: string | null
  content: string
  createdBy: number | null
  updatedBy: number | null
  createdAt: string
  updatedAt: string
}

export interface PageDetailDto extends PageDto {
  updatedByUsername: string | null
}

export interface MediaDto {
  id: number
  filename: string
  originalName: string
  mime: string
  size: number
  kind: MediaKind
  uploadedBy: number | null
  createdAt: string
}

export interface TreeNode {
  label: string
  path?: string
  icon?: SidebarIconName
  children: TreeNode[]
}

export interface SearchResultDto {
  path: string
  title: string
  excerpt: string
}

export interface SidebarDto {
  mode: "auto" | "manual"
  tree: TreeNode[]
  manualTree: TreeNode[]
}

export interface SettingsSummaryDto {
  pageCount: number
  mediaCount: number
  userCount?: number
  recentPages: Array<Pick<PageDto, "path" | "title" | "updatedAt"> & { username: string | null }>
}

export interface MinecraftServerStatusDto {
  address: string
  online: boolean
  players?: { online: number, max: number }
  version?: string
  description?: string
  favicon?: string
}
