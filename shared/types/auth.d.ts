import type { Role } from "./api"

declare module "#auth-utils" {
  interface User {
    id: number
    discordId: string
    username: string
    avatarUrl?: string | null
    role: Role
  }
}

export {}
