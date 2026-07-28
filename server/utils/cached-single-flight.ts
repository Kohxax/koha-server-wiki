interface CachedFetcherOptions {
  /** How long a resolved value stays fresh before it is re-fetched. */
  ttlMs: number
  /** Maximum number of entries kept in the cache before the oldest is evicted. */
  maxEntries: number
}

interface CacheEntry<V> {
  value: V
  expiresAt: number
}

/**
 * Creates a keyed cache with TTL expiry, in-flight request de-duplication,
 * and FIFO eviction once `maxEntries` is reached. Concurrent calls for the
 * same key while a fetch is pending share the same promise, and a value is
 * only cached after its fetcher resolves successfully (a rejected fetcher
 * is not cached and propagates to every caller awaiting it).
 */
export function createCachedFetcher<V>(options: CachedFetcherOptions) {
  const cache = new Map<string, CacheEntry<V>>()
  const pending = new Map<string, Promise<V>>()

  return async function getCached(key: string, fetcher: () => Promise<V>): Promise<V> {
    const cached = cache.get(key)
    if (cached && cached.expiresAt > Date.now())
      return cached.value

    const existing = pending.get(key)
    if (existing)
      return await existing

    const request = fetcher()
    pending.set(key, request)
    try {
      const value = await request
      if (cache.size >= options.maxEntries)
        cache.delete(cache.keys().next().value!)
      cache.set(key, { value, expiresAt: Date.now() + options.ttlMs })
      return value
    } finally {
      pending.delete(key)
    }
  }
}
