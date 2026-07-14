export default defineOAuthDiscordEventHandler({
  config: {
    emailRequired: false,
    profileRequired: true,
  },
  async onSuccess(event, { user }) {
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : null

    const dbUser = await upsertDiscordUser({
      discordId: user.id,
      username: user.username,
      avatarUrl,
    })

    await setUserSession(event, { user: toSessionUser(dbUser) })

    return sendRedirect(event, "/")
  },
  onError(event) {
    return sendRedirect(event, "/login?error=discord")
  },
})
