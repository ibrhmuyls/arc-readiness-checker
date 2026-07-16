// Tiny in-memory TTL cache. Survives across requests within a warm server
// instance (good enough for Vercel; cold starts simply miss). Prevents
// hammering the public explorer for repeat lookups of the same address.

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > now) {
    return hit.value;
  }
  const value = await producer();
  store.set(key, { value, expires: now + ttlSeconds * 1000 });
  return value;
}

export function clearCache(): void {
  store.clear();
}
