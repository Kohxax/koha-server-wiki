import type { TreeNode } from "~~/shared/types/api"

// Every /api/pages/tree consumer shares this key so a single refresh
// invalidates the tree everywhere it's rendered (sidebar settings, page
// management, the internal-link picker, ...). Splitting this into
// per-page keys is what let deleted/renamed pages linger in some of those
// views after a save or delete elsewhere.
const PAGE_TREE_KEY = "page-tree"

export function usePageTree() {
  return useFetch<TreeNode[]>("/api/pages/tree", { key: PAGE_TREE_KEY })
}

export function refreshPageTree() {
  return refreshNuxtData(PAGE_TREE_KEY)
}
