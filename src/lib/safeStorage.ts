/**
 * Safe wrappers around localStorage/sessionStorage.
 *
 * In some environments (private browsing mode, disabled cookies/storage,
 * quota exceeded) direct access to Web Storage may throw SecurityError or
 * QuotaExceededError. These helpers never throw: reads fall back to the
 * provided default value, writes silently fail.
 */

export function safeGetItem(key: string, fallback?: string | null): string | null {
  try {
    return localStorage.getItem(key) ?? fallback ?? null;
  } catch {
    return fallback ?? null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

export function safeGetJSON<T>(key: string, fallback: T): T {
  const raw = safeGetItem(key);
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key: string, value: unknown): boolean {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function safeSessionGetItem(key: string, fallback?: string | null): string | null {
  try {
    return sessionStorage.getItem(key) ?? fallback ?? null;
  } catch {
    return fallback ?? null;
  }
}

export function safeSessionSetItem(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeSessionRemoveItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch { /* ignore */ }
}
