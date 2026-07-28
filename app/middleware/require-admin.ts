export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value)
    return navigateTo(`/login?redirect=${encodeURIComponent(useRequestURL().pathname)}`)

  if (!canAdmin(user.value?.role))
    return navigateTo("/")
})
