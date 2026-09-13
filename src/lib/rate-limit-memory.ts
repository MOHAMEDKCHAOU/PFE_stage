/**
 * Limiteur simple en mémoire (processus unique). Utile contre les abus « basiques ».
 * En cluster / serverless multi-instances, préférer Redis ou un service de rate-limit edge.
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

const MAX_KEYS = 5000;

function prune(now: number) {
  if (store.size <= MAX_KEYS) return;
  for (const [k, v] of store) {
    if (now >= v.resetAt) store.delete(k);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  prune(now);
  let e = store.get(key);
  if (!e || now >= e.resetAt) {
    e = { count: 0, resetAt: now + windowMs };
    store.set(key, e);
  }
  if (e.count >= limit) {
    return { ok: false, retryAfterMs: Math.max(1000, e.resetAt - now) };
  }
  e.count += 1;
  return { ok: true };
}
