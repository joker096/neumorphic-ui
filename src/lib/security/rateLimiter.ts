// Rate Limiter - Protects against DoS and brute-force attacks

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitState {
  limit: number;
  windowMs: number;
  requests: { timestamp: number }[];
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 10,
  windowMs: 60000, // 1 minute
};

const RATE_LIMIT_STORE_KEY = '__mess_rate_limits';

class RateLimiter {
  private states: Map<string, RateLimitState> = new Map();

  constructor(defaultConfig: Partial<RateLimitConfig> = {}) {
    const config = { ...DEFAULT_CONFIG, ...defaultConfig };
    try {
      const stored = localStorage.getItem(RATE_LIMIT_STORE_KEY);
      if (stored) {
        this.states = new Map(Object.entries(JSON.parse(stored)));
      }
    } catch {
      // Storage not available
    }
  }

  checkLimit(identifier: string, config?: Partial<RateLimitConfig>): boolean {
    const effectiveConfig = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();
    const windowStart = now - effectiveConfig.windowMs;

    let state = this.states.get(identifier);
    if (!state) {
      state = {
        limit: effectiveConfig.limit,
        windowMs: effectiveConfig.windowMs,
        requests: [],
      };
    }

    // Filter out requests outside the window
    state.requests = state.requests.filter((r) => r.timestamp > windowStart);

    if (state.requests.length >= state.limit) {
      // Rate limit exceeded
      return false;
    }

    // Record this request
    state.requests.push({ timestamp: now });
    this.states.set(identifier, state);

    return true;
  }

  resetLimit(identifier: string): void {
    this.states.delete(identifier);
  }

  getMetrics(identifier?: string): {
    totalRequests: number;
    currentRequests: number;
    remaining: number;
    isLimited: boolean;
  } | null {
    if (identifier) {
      const state = this.states.get(identifier);
      if (!state) {
        return {
          totalRequests: 0,
          currentRequests: 0,
          remaining: state.limit,
          isLimited: false,
        };
      }
      const now = Date.now();
      const windowStart = now - state.windowMs;
      const currentRequests = state.requests.filter((r) => r.timestamp > windowStart);
      return {
        totalRequests: state.requests.length,
        currentRequests: currentRequests.length,
        remaining: state.limit - currentRequests.length,
        isLimited: currentRequests.length >= state.limit,
      };
    }
    return null;
  }

  saveToStorage(): void {
    try {
      const serialized = Object.fromEntries(
        Array.from(this.states.entries()).map(([key, state]) => [
          key,
          {
            limit: state.limit,
            windowMs: state.windowMs,
            requests: state.requests.map((r) => r.timestamp),
          },
        ])
      );
      localStorage.setItem(RATE_LIMIT_STORE_KEY, JSON.stringify(serialized));
    } catch {
      // Storage not available
    }
  }

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_STORE_KEY);
      if (stored) {
        this.states = new Map(
          Object.entries(JSON.parse(stored)).map(([key, val]: [string, any]) => [
            key,
            {
              limit: val.limit,
              windowMs: val.windowMs,
              requests: val.requests.map((ts: number) => ({ timestamp: ts })),
            },
          ])
        );
      }
    } catch {
      // Storage not available
    }
  }
}

export const rateLimiter = new RateLimiter();
