// KEJA HALISI — link-only TTL cache (E: SWR-style, keyed by URL, no DB)
// oEmbed links: TTL 1h • weather/distance links: TTL 6h
// Works on client and server (module-level Map).

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const TTL_OEMBED = 60 * 60 * 1000; // 1h
export const TTL_WEATHER = 6 * 60 * 60 * 1000; // 6h
export const TTL_DISTANCE = 6 * 60 * 60 * 1000; // 6h

/** Deduped, TTL-cached fetch-or-compute. Never throws — returns fallback on error. */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  fallback?: T,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) return hit.value;

  if (inflight.has(key)) return inflight.get(key) as Promise<T>;

  const p = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    } catch {
      if (fallback !== undefined) return fallback;
      throw new Error(`cached: loader failed and no fallback for ${key}`);
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p as Promise<T>;
}

/** Invalidate one key or everything (e.g. low-data toggle off). */
export function invalidateCache(key?: string) {
  if (key) store.delete(key);
  else store.clear();
}

/** Cache stats for the admin/debug panel. */
export function cacheStats() {
  const now = Date.now();
  let fresh = 0;
  for (const e of store.values()) if (e.expires > now) fresh++;
  return { entries: store.size, fresh };
}
