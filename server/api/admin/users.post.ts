import { eq } from "drizzle-orm"
import { z } from "zod"
import { useDb } from "../../database/client"
import { users } from "../../database/schema"

const bodySchema = z.object({
  userId: z.number().int(),
  role: z.enum(["admin", "editor", "viewer"]),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const { userId, role } = await readValidatedBody(event, bodySchema.parse)

  if (userId === admin.id && role !== "admin")
    throw createError({ statusCode: 400, statusMessage: "自分自身の管理者権限は降格できません" })

  const db = useDb()
  const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning()
  if (!updated)
    throw createError({ statusCode: 404, statusMessage: "User not found" })

  return updated
})
