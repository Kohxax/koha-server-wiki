import type { H3Event } from "h3"
import { eq } from "drizzle-orm"
import { createError } from "h3"
import { useDb } from "../database/client"
import { users } from "../database/schema"
import type { User } from "../database/schema"
import { canAdmin, canEdit } from "./permissions"

async function currentDbUser(event: H3Event): Promise<User> {
  const session = await requireUserSession(event)
  const db = useDb()
  const [dbUser] = await db.select().from(users).where(eq(users.id, session.user.id))
  if (!dbUser)
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
  return dbUser
}

export async function requireEditor(event: H3Event): Promise<User> {
  const dbUser = await currentDbUser(event)
  if (!canEdit(dbUser.role))
    throw createError({ statusCode: 403, statusMessage: "Forbidden" })
  return dbUser
}

export async function requireAdmin(event: H3Event): Promise<User> {
  const dbUser = await currentDbUser(event)
  if (!canAdmin(dbUser.role))
    throw createError({ statusCode: 403, statusMessage: "Forbidden" })
  return dbUser
}
