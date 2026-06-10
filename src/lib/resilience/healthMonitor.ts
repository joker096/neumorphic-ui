// Health Monitor - Monitor system health

export interface HealthMetric {
  name: string;
  value: number;
  timestamp: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical?: boolean;
}

export class HealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private metrics: HealthMetric[] = [];

  addCheck(name: string, check: () => Promise<boolean>, critical = false): void {
    this.checks.set(name, {
      name,
      check,
      critical,
    });
  }

  async check(): Promise<{ healthy: boolean; results: { name: string; status: boolean }[] }> {
    const results = [];

    for (const [, check] of this.checks) {
      try {
        const result = await check.check();
        results.push({ name: check.name, status: result });

        this.metrics.push({
          name: check.name,
          value: result ? 1 : 0,
          timestamp: Date.now(),
          status: result ? 'healthy' : 'unhealthy',
        });
      } catch {
        results.push({ name: check.name, status: false });
        this.metrics.push({
          name: check.name,
          value: 0,
          timestamp: Date.now(),
          status: 'unhealthy',
        });
      }
    }

    return {
      healthy: results.every((r) => r.status),
      results,
    };
  }

  getStats(): { total: number; healthy: number; unhealthy: number } {
    const total = this.checks.size;
    const healthy = this.metrics.filter((m) => m.status === 'healthy').length;
    const unhealthy = this.metrics.filter((m) => m.status === 'unhealthy').length;

    return { total, healthy, unhealthy };
  }
}

export const healthMonitor = new HealthMonitor();
