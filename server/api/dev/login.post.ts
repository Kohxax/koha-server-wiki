import { z } from "zod"

const bodySchema = z.object({
  role: z.enum(["admin", "editor", "viewer"]),
})

export default defineEventHandler(async (event) => {
  if (!isDevAuthBypassEnabled())
    throw createError({ statusCode: 404, statusMessage: "Not Found" })

  const { role } = await readValidatedBody(event, bodySchema.parse)

  const dbUser = await upsertDiscordUser({
    discordId: `dev-${role}`,
    username: `dev-${role}`,
    avatarUrl: null,
  })

  // upsertDiscordUser only assigns admin via NUXT_ADMIN_DISCORD_IDS, so force the requested role here.
  const forcedUser = await setDevUserRole(dbUser.id, role)

  await setUserSession(event, { user: toSessionUser(forcedUser) })

  return { ok: true, user: toSessionUser(forcedUser) }
})
