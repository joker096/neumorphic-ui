import { retry } from '../lib/retry';

// Track component mount states to prevent state updates on unmounted components
const componentMap = new Map<number, () => boolean>();

export function trackComponentMount(mounted: () => boolean): () => void {
  const id = Math.random().toString(36).slice(2);
  const key = Number(id);
  componentMap.set(key, mounted);
  return () => componentMap.delete(key);
}

export function safeSet<T extends Record<string, any>>(
  setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
  partial: Partial<T>,
): void {
  // Find a mounted component to check against
  const isMounted = Array.from(componentMap.values()).some((fn) => fn());
  if (!isMounted) {
    console.warn('[GracefulDegradation] State update skipped — component may be unmounted');
    return;
  }
  try {
    setState(partial);
  } catch (e) {
    console.error('[GracefulDegradation] State update failed:', e);
  }
}

// Retryable storage write with exponential backoff
export async function retryableWrite<T>(
  fn: () => Promise<T>,
  options?: Partial<import('../lib/retry').RetryOptions>,
): Promise<T | null> {
  try {
    return await retry(fn, {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoff: 'exponential',
      ...options,
    });
  } catch (error) {
    console.error('[GracefulDegradation] All retry attempts failed:', error);
    return null;
  }
}

// Safe storage read with fallback
export async function safeRead<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn('[GracefulDegradation] Read failed, using fallback:', error);
    return fallback;
  }
}

// Retry a connection with graceful degradation
export async function retryWithFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  options?: Partial<import('../lib/retry').RetryOptions>,
): Promise<T> {
  try {
    return await retry(primary, { maxRetries: 2, baseDelay: 500, ...options });
  } catch (primaryError) {
    console.warn('[GracefulDegradation] Primary connection failed, trying fallback...', primaryError);
    try {
      return await retry(fallback, { maxRetries: 1, baseDelay: 1000, ...options });
    } catch (fallbackError) {
      console.error('[GracefulDegradation] Both primary and fallback failed:', fallbackError);
      throw primaryError; // Throw primary error — it's the root cause
    }
  }
}

// Initialize with fallback
export function initWithFallback<T>(
  primaryInit: () => Promise<T>,
  fallbackInit: () => Promise<T>,
): Promise<T> {
  return primaryInit().catch(() => fallbackInit());
}

// Safe async operation that catches all errors
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.warn('[GracefulDegradation] Async operation failed:', error);
    if (fallback !== undefined) return fallback;
    return undefined;
  }
}
