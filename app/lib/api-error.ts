interface ApiErrorLike {
  data?: { statusMessage?: unknown, message?: unknown }
  statusMessage?: unknown
  message?: unknown
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object")
    return fallback

  const candidate = error as ApiErrorLike
  const values = [candidate.data?.statusMessage, candidate.data?.message, candidate.statusMessage, candidate.message]
  return values.find((value): value is string => typeof value === "string" && value.length > 0) ?? fallback
}
