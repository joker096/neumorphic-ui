import type {IncomingMessage, ServerResponse} from 'node:http';

interface RateLimitEntry {
  count: number;
  resetAt: number;
  /**
   * Absolute timestamp until which the key is locked out.
   *
   * A lockout outranks the window: while it is active the key is rejected even
   * if the window already expired. Used by the credential routes, where a
   * fixed window alone would let a brute-forcer continue after every window.
   */
  lockedUntil?: number;
}

// In-memory rate limiter
const rateLimits = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 10;

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  key?: string;
  /**
   * Optional lockout. When set and the budget is exhausted, the key is locked
   * for that long and every later attempt is rejected until it expires.
   */
  lockoutMs?: number;
}

export function checkRateLimit(
  key: string,
  opts: RateLimitConfig = {},
): { allowed: boolean; remaining: number } {
  const window = opts.windowMs ?? DEFAULT_WINDOW;
  const maxRequests = opts.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const lockoutMs = opts.lockoutMs;
  const now = Date.now();

  const existing = rateLimits.get(key);

  // A live lockout outranks the window: the key stays rejected even when the
  // window already expired.
  if (existing && existing.lockedUntil && now < existing.lockedUntil) {
    return { allowed: false, remaining: 0 };
  }

  if (!existing || now > existing.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    if (lockoutMs !== undefined) {
      existing.lockedUntil = now + lockoutMs;
    }
    return { allowed: false, remaining: 0 };
  }

  existing.count++;
  return { allowed: true, remaining: maxRequests - existing.count };
}

export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    // A locked key must survive the sweeper, otherwise the lockout would be
    // dropped exactly when the brute-force attempt is still running.
    const locked = entry.lockedUntil !== undefined && now < entry.lockedUntil;
    if (now > entry.resetAt && !locked) {
      rateLimits.delete(key);
    }
  }
}

/**
 * Test seam: drop every bucket (both the plain windows and the lockouts).
 */
export function resetRateLimits(): void {
  rateLimits.clear();
}

// Start cleanup interval
setInterval(cleanupRateLimits, 5 * 60 * 1000);

import type { AuthenticatedRequest } from './auth.js';
import { authenticate, writeUnauthorized } from './auth.js';

/**
 * A fixed-window rate limiter with an explicit budget.
 *
 * The shared `checkRateLimit` above serves the public endpoints; this one
 * exists for the admin panel, where the budget has to belong to a single
 * administrator instead of to the egress IP of the caller.
 */
export interface RateLimiter {
  /** Count one hit for `key`; returns false once the window budget is spent. */
  check(key: string): boolean;
  /** Number of live buckets (test seam). */
  size(): number;
  /** Drop every bucket (test seam). */
  reset(): void;
}

/** Sweep the bucket map once it grew past this size. */
const SWEEP_THRESHOLD = 1024;

export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): boolean {
      const now = Date.now();
      if (buckets.size >= SWEEP_THRESHOLD) {
        for (const [k, entry] of buckets) {
          if (now > entry.resetAt) buckets.delete(k);
        }
      }
      const entry = buckets.get(key);
      if (!entry || now > entry.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      if (entry.count >= maxRequests) return false;
      entry.count++;
      return true;
    },
    size(): number {
      return buckets.size;
    },
    reset(): void {
      buckets.clear();
    },
  };
}

/** Bucket key for anonymous (or unusable-token) traffic. */
export function ipRateLimitKey(ip: string): string {
  return 'ip:' + ip;
}

/** Bucket key for a signed-in administrator. */
export function adminRateLimitKey(adminId: number): string {
  return 'admin:' + adminId;
}

/** The two buckets an admin endpoint spends from. */
export interface AdminLimiters {
  /** Anonymous traffic: shared per egress IP. */
  anonymous: RateLimiter;
  /** Signed-in operators: one bucket per administrator. */
  admin: RateLimiter;
}

export function tooManyRequests(res: ServerResponse): void {
  res.writeHead(429, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Too many requests' }));
}

/**
 * Authorize an admin request and charge it to the matching rate-limit bucket.
 *
 * Anonymous requests and requests with an unusable token spend the per-IP
 * bucket, which keeps a flood of unauthenticated traffic away from the
 * database. A signed-in administrator spends their own per-admin bucket, so
 * operators behind a shared egress IP can never lock each other out - and
 * anonymous traffic can never exhaust the budget of a valid session.
 *
 * Returns the administrator on success; on failure the response is already
 * written (401 or 429) and `null` is returned.
 */
export function authorizeAdminRequest(
  req: AuthenticatedRequest,
  res: ServerResponse,
  ip: string,
  limiters: AdminLimiters
): { adminId: number; username: string } | null {
  const result = authenticate(req);
  if (!result.ok) {
    if (!limiters.anonymous.check(ipRateLimitKey(ip))) {
      tooManyRequests(res);
      return null;
    }
    writeUnauthorized(res, result.reason ?? 'invalid');
    return null;
  }
  const admin = result.admin!;
  if (!limiters.admin.check(adminRateLimitKey(admin.adminId))) {
    tooManyRequests(res);
    return null;
  }
  req.admin = admin;
  return admin;
}
