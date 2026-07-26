export function useDiagramMediaVersions() {
  const sessionVersion = useState<number>("diagram-media-session-version", () => Date.now())
  const mediaVersions = useState<Record<string, number>>("diagram-media-versions", () => ({}))

  function versionedSrc(src: string): string {
    if (!src)
      return src

    const version = mediaVersions.value[src] ?? sessionVersion.value
    return `${src}${src.includes("?") ? "&" : "?"}v=${version}`
  }

  function refreshVersion(src: string): void {
    if (!src)
      return

    const current = mediaVersions.value[src] ?? sessionVersion.value
    mediaVersions.value = {
      ...mediaVersions.value,
      [src]: Math.max(Date.now(), current + 1),
    }
  }

  return { versionedSrc, refreshVersion }
}
