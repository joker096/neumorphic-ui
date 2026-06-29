export type RetryOptions = {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoff?: "linear" | "exponential" | "fixed";
  onRetry?: (attempt: number, error: Error) => void;
  onError?: (error: Error) => void;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoff: "exponential",
  onRetry: () => {},
  onError: () => {},
};

function getDelay(attempt: number, options: Required<RetryOptions>): number {
  const { baseDelay, maxDelay, backoff } = options;
  let delay: number;

  switch (backoff) {
    case "linear":
      delay = baseDelay * attempt;
      break;
    case "fixed":
      delay = baseDelay;
      break;
    case "exponential":
    default:
      delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      break;
  }

  // Add jitter (±20%) to avoid thundering herd
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
}

export async function retry<T>(
  fn: () => Promise<T> | T,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < opts.maxRetries) {
        const delay = getDelay(attempt, opts);
        opts.onRetry(attempt, lastError);
        console.warn(`[Retry] Attempt ${attempt}/${opts.maxRetries} failed. Retrying in ${delay}ms...`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  opts.onError(lastError!);
  throw lastError!;
}

export function retrySync<T>(
  fn: () => T,
  options: RetryOptions = {}
): T {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < opts.maxRetries) {
        const delay = getDelay(attempt, opts);
        opts.onRetry(attempt, lastError);
        console.warn(`[RetrySync] Attempt ${attempt}/${opts.maxRetries} failed. Retrying...`, error);
        // Sync retry — use setTimeout but return immediately on last attempt
        if (attempt < opts.maxRetries) {
          // For sync, we can't truly wait, so just continue
          // In practice, this means sync retries are instant
        }
      }
    }
  }

  opts.onError(lastError!);
  throw lastError!;
}
