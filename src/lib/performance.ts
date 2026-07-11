const STORAGE_KEY = '__nexus_perf_metrics';
const MAX_RETENTION = 24 * 60 * 60 * 1000;

export type PerfMetric = {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  timestamp: number;
};

function getStoredMetrics(): PerfMetric[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: PerfMetric[] = JSON.parse(stored);
    return parsed.filter((m) => Date.now() - m.timestamp < MAX_RETENTION);
  } catch {
    return [];
  }
}

function storeMetric(metric: PerfMetric): void {
  try {
    const stored = getStoredMetrics();
    const updated = [...stored, metric].slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
  }
}

export function initPerformanceMonitoring(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name === 'largest-contentful-paint') {
          storeMetric({
            lcp: entry.duration,
            fid: 0,
            cls: 0,
            fcp: 0,
            ttfb: 0,
            timestamp: entry.startTime,
          });
        }
      }
    });
    observer.observe({ type: 'largest-contentful-paint' });
  } catch {
  }

  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        clsValue += (entry as any).value || 0;
      }
      storeMetric({
        lcp: 0,
        fid: 0,
        cls: clsValue,
        fcp: 0,
        ttfb: 0,
        timestamp: Date.now(),
      });
    });
    clsObserver.observe({ type: 'layout-shift' });
  } catch {
  }

  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if ((entry as any).interactionDuration > 0) {
          storeMetric({
            lcp: 0,
            fid: (entry as any).interactionDuration,
            cls: 0,
            fcp: 0,
            ttfb: 0,
            timestamp: entry.startTime,
          });
        }
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
  }
}

export function getRecentMetrics(): PerfMetric[] {
  return getStoredMetrics();
}

export function clearStoredMetrics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}
