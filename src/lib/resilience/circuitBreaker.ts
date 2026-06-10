// Circuit Breaker - Protect against cascading failures

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number;
  successCount: number;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  successThreshold: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  recoveryTimeout: 60000,
  successThreshold: 3,
};

export class CircuitBreaker {
  private options: CircuitBreakerOptions;
  private state: CircuitBreakerState = {
    state: 'closed',
    failures: 0,
    lastFailureTime: 0,
    successCount: 0,
  };

  constructor(options?: Partial<CircuitBreakerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async fire<T>(fn: (...args: any[]) => Promise<T>, ..._args: any[]): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'open') {
      // Check if recovery timeout has passed
      if (Date.now() < this.state.lastFailureTime + this.options.recoveryTimeout) {
        throw new Error('Circuit breaker is open');
      }

      // Transition to half-open
      this.state.state = 'half-open';
      this.state.successCount = 0;
    }

    try {
      const result = await fn(..._args);

      // Success
      this.state.failures = 0;
      this.state.successCount++;

      // If half-open and enough successes, close the circuit
      if (this.state.state === 'half-open' && this.state.successCount >= this.options.successThreshold) {
        this.state.state = 'closed';
        this.state.failures = 0;
      }

      return result;
    } catch (error) {
      // Failure
      this.state.failures++;
      this.state.lastFailureTime = Date.now();

      // If failure threshold reached, open the circuit
      if (this.state.failures >= this.options.failureThreshold) {
        this.state.state = 'open';
      }

      throw error;
    }
  }

  reset(): void {
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

export async function withRetry<T>(fn: () => Promise<T>, options?: Partial<CircuitBreakerOptions>): Promise<T> {
  const breaker = new CircuitBreaker(options);
  return breaker.fire(fn);
}

export const circuitBreaker = new CircuitBreaker();
