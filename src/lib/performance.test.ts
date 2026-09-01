import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- Mock PerformanceObserver ---
const mockObservers: Array<{
  callback: (list: { getEntries: () => any[] }) => void;
  type: string;
  buffered: boolean;
  triggered: boolean;
}> = [];

vi.stubGlobal('PerformanceObserver', class {
  callback: (list: { getEntries: () => any[] }) => void;
  type = '';
  buffered = false;

  constructor(cb: (list: { getEntries: () => any[] }) => void) {
    this.callback = cb;
  }

  observe(opts: { type: string; buffered?: boolean }): void {
    this.type = opts.type;
    this.buffered = opts.buffered ?? false;
    mockObservers.push(this as any);
  }

  disconnect(): void {}
} as any);

describe('performance', () => {
  let initPerformanceMonitoring: typeof import('./performance').initPerformanceMonitoring;
  let getRecentMetrics: typeof import('./performance').getRecentMetrics;
  let clearStoredMetrics: typeof import('./performance').clearStoredMetrics;

  beforeEach(async () => {
    mockObservers.length = 0;
    localStorage.clear();
    vi.resetModules();
    const mod = await import('./performance');
    initPerformanceMonitoring = mod.initPerformanceMonitoring;
    getRecentMetrics = mod.getRecentMetrics;
    clearStoredMetrics = mod.clearStoredMetrics;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('getRecentMetrics returns empty array when no data', () => {
    expect(getRecentMetrics()).toEqual([]);
  });

  it('clearStoredMetrics removes all data', () => {
    localStorage.setItem('__nexus_perf_metrics', JSON.stringify([{ lcp: 100, fid: 0, cls: 0, fcp: 0, ttfb: 0, timestamp: Date.now() }]));
    clearStoredMetrics();
    expect(getRecentMetrics()).toEqual([]);
  });

  it('initPerformanceMonitoring creates 3 observers', () => {
    initPerformanceMonitoring();
    expect(mockObservers).toHaveLength(3);
    expect(mockObservers.map((o) => o.type)).toEqual([
      'largest-contentful-paint',
      'layout-shift',
      'first-input',
    ]);
  });

  it('LCP observer stores metric with lcp value', () => {
    initPerformanceMonitoring();
    const lcpObserver = mockObservers.find((o) => o.type === 'largest-contentful-paint')!;

    lcpObserver.callback({
      getEntries: () => [{ name: 'largest-contentful-paint', duration: 1200, startTime: Date.now() }],
    });

    const metrics = getRecentMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].lcp).toBe(1200);
    expect(metrics[0].fid).toBe(0);
    expect(metrics[0].cls).toBe(0);
  });

  it('CLS observer accumulates layout shift values', () => {
    initPerformanceMonitoring();
    const clsObserver = mockObservers.find((o) => o.type === 'layout-shift')!;

    clsObserver.callback({ getEntries: () => [{ value: 0.05 }] });
    clsObserver.callback({ getEntries: () => [{ value: 0.03 }] });

    const metrics = getRecentMetrics();
    // Each callback stores a separate metric
    expect(metrics.length).toBeGreaterThanOrEqual(1);
    // Last stored metric has accumulated cls
    const last = metrics[metrics.length - 1];
    expect(last.cls).toBe(0.08);
  });

  it('FID observer stores metric with interactionDuration', () => {
    initPerformanceMonitoring();
    const fidObserver = mockObservers.find((o) => o.type === 'first-input')!;

    fidObserver.callback({
      getEntries: () => [{ interactionDuration: 50, startTime: Date.now() }],
    });

    const metrics = getRecentMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].fid).toBe(50);
  });

  it('FID observer ignores entries with interactionDuration=0', () => {
    initPerformanceMonitoring();
    const fidObserver = mockObservers.find((o) => o.type === 'first-input')!;

    fidObserver.callback({
      getEntries: () => [{ interactionDuration: 0, startTime: Date.now() }],
    });

    expect(getRecentMetrics()).toEqual([]);
  });

  it('metrics are capped at 100 entries', () => {
    initPerformanceMonitoring();
    const lcpObserver = mockObservers.find((o) => o.type === 'largest-contentful-paint')!;

    // Store 120 metrics
    for (let i = 0; i < 120; i++) {
      lcpObserver.callback({
        getEntries: () => [{ name: 'largest-contentful-paint', duration: i, startTime: Date.now() }],
      });
    }

    const metrics = getRecentMetrics();
    expect(metrics).toHaveLength(100);
    // Most recent 100 retained (oldest dropped)
    expect(metrics[0].lcp).toBe(20);
    expect(metrics[99].lcp).toBe(119);
  });

  it('metrics older than 24h are filtered out', () => {
    const old = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(
      '__nexus_perf_metrics',
      JSON.stringify([
        { lcp: 100, fid: 0, cls: 0, fcp: 0, ttfb: 0, timestamp: old },
        { lcp: 200, fid: 0, cls: 0, fcp: 0, ttfb: 0, timestamp: Date.now() },
      ]),
    );

    const metrics = getRecentMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].lcp).toBe(200);
  });

  it('initPerformanceMonitoring handles missing PerformanceObserver gracefully', () => {
    // Save and remove
    const OrigPO = (globalThis as any).PerformanceObserver;
    delete (globalThis as any).PerformanceObserver;

    // Re-import to re-capture hasObserver behavior
    // initPerformanceMonitoring wraps each observer in try-catch
    expect(() => initPerformanceMonitoring()).not.toThrow();

    // Restore
    (globalThis as any).PerformanceObserver = OrigPO;
  });
});
