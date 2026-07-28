import type { MediaDto } from "~~/shared/types/api"

// Shared across every /api/media consumer (the media picker dialog and the
// admin media page) so a single refresh invalidates both. Previously each
// caller used its own key, so e.g. uploading through the picker dialog
// never invalidated the admin media page's list.
const MEDIA_LIBRARY_KEY = "media-library"

export function useMediaLibrary(options?: { immediate?: boolean }) {
  return useFetch<MediaDto[]>("/api/media", {
    key: MEDIA_LIBRARY_KEY,
    immediate: options?.immediate ?? true,
  })
}

export function refreshMediaLibrary() {
  return refreshNuxtData(MEDIA_LIBRARY_KEY)
}
