// Integration Hub — Metrics (blueprint §75). In-memory counters; prod = Prometheus/StatsD.
export class Metrics {
  private counters: Record<string, number> = {}
  inc(name: string, by = 1): void {
    this.counters[name] = (this.counters[name] ?? 0) + by
  }
  get(name: string): number {
    return this.counters[name] ?? 0
  }
  snapshot(): Record<string, number> {
    return { ...this.counters }
  }
}

export const metrics = new Metrics()
