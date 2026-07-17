import process from "node:process"
import { eq } from "drizzle-orm"
import { useDb } from "../database/client"
import { users } from "../database/schema"
import type { User } from "../database/schema"

function adminDiscordIds(): string[] {
  return (process.env.NUXT_ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map(id => id.trim())
    .filter(Boolean)
}

export async function upsertDiscordUser(input: {
  discordId: string
  username: string
  avatarUrl?: string | null
}): Promise<User> {
  const db = useDb()
  const [existing] = await db.select().from(users).where(eq(users.discordId, input.discordId))

  if (existing) {
    const role = adminDiscordIds().includes(input.discordId) ? "admin" : existing.role
    const [updated] = await db.update(users)
      .set({ username: input.username, avatarUrl: input.avatarUrl ?? null, role })
      .where(eq(users.id, existing.id))
      .returning()
    if (!updated)
      throw new Error("Failed to update user")
    return updated
  }

  const role = adminDiscordIds().includes(input.discordId) ? "admin" : "viewer"
  const [created] = await db.insert(users)
    .values({ discordId: input.discordId, username: input.username, avatarUrl: input.avatarUrl ?? null, role })
    .returning()
  if (!created)
    throw new Error("Failed to create user")
  return created
}

export async function setDevUserRole(userId: number, role: "admin" | "editor" | "viewer"): Promise<User> {
  const db = useDb()
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning()
  if (!updated)
    throw new Error("Failed to update user role")
  return updated
}

export function toSessionUser(user: User) {
  return {
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: user.role,
  }
}
