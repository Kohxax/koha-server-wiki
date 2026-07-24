export const copyrightStartYear = 2026

export function formatCopyrightYears(currentYear = new Date().getFullYear()) {
  return currentYear <= copyrightStartYear
    ? String(copyrightStartYear)
    : `${copyrightStartYear} - ${currentYear}`
}
