export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value)
    return navigateTo(`/login?redirect=${encodeURIComponent(useRequestURL().pathname)}`)

  if (!canEdit(user.value?.role))
    return navigateTo("/")
})
