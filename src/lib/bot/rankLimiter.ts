// Bot Rate Limiter - Rate limiting for bot requests

export class BotRateLimiter {
  private limits: Map<string, { count: number; reset: number }> = new Map();
  private defaultLimit = 100;
  private defaultWindow = 60000; // 1 minute

  constructor(defaultLimit = 100, defaultWindow = 60000) {
    this.defaultLimit = defaultLimit;
    this.defaultWindow = defaultWindow;
  }

  allowRequest(identifier: string): boolean {
    const now = Date.now();
    const limit = this.limits.get(identifier);

    if (!limit || limit.reset < now) {
      // Reset counter
      this.limits.set(identifier, {
        count: 1,
        reset: now + this.defaultWindow,
      });
      return true;
    }

    if (limit.count >= this.defaultLimit) {
      return false;
    }

    limit.count++;
    this.limits.set(identifier, limit);
    return true;
  }

  getRemaining(identifier: string): number {
    const limit = this.limits.get(identifier);
    if (!limit) {
      return this.defaultLimit;
    }
    return Math.max(0, this.defaultLimit - limit.count);
  }

  reset(identifier: string): void {
    this.limits.delete(identifier);
  }
}

export const botRateLimiter = new BotRateLimiter();
