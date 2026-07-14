declare module "#auth-utils" {
  interface User {
    id: number
    discordId: string
    username: string
    avatarUrl?: string | null
    role: "admin" | "editor" | "viewer"
  }
}

export {}
