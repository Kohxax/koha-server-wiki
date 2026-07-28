/** Formats a date-like value as a Japanese date and time, e.g. "2026年7月28日 12:34". */
export function formatDateTime(value: string | number | Date): string {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

/** Formats a date-like value as a Japanese date, e.g. "2026年7月28日". */
export function formatDate(value: string | number | Date): string {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(new Date(value))
}
