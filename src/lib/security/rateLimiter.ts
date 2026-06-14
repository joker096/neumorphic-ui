interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  return true;
}

export function getRateLimitRemaining(key: string): number {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.resetAt) return 60;
  return Math.max(0, 60 - entry.count);
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function clearAllRateLimits(): void {
  store.clear();
}
