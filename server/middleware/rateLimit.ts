import type {IncomingMessage, ServerResponse} from 'node:http';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter
const rateLimits = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10;

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  key?: string;
}

export function checkRateLimit(
  key: string,
  opts: RateLimitConfig = {},
): { allowed: boolean; remaining: number } {
  const window = opts.windowMs ?? DEFAULT_WINDOW;
  const maxRequests = opts.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  const existing = rateLimits.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  existing.count++;
  return { allowed: true, remaining: maxRequests - existing.count };
}

export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key);
    }
  }
}

// Start cleanup interval
setInterval(cleanupRateLimits, 5 * 60 * 1000);