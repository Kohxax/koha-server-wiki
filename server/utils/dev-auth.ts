import process from "node:process"

export function isDevAuthBypassEnabled(): boolean {
  return Boolean(process.env.NUXT_DEV_AUTH_BYPASS)
}
