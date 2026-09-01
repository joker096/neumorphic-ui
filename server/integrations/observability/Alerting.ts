// Monitoring/alerting seed (ACTION_PLAN item 8, §75-§77). In-memory thresholds.
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  code: string;
  severity: AlertSeverity;
  message: string;
  at: string;
}

const THRESHOLDS = {
  queueDepth: 1000,
  errorRate: 0.2,
  providerDownSeconds: 300,
};

export class Alerting {
  private alerts: Alert[] = [];

  check(opts: {
    queueDepth?: number;
    errorRate?: number;
    providerDownSeconds?: number;
  }): Alert[] {
    const fired: Alert[] = [];
    if (opts.queueDepth !== undefined && opts.queueDepth > THRESHOLDS.queueDepth) {
      fired.push({
        code: 'QUEUE_STALLED',
        severity: 'critical',
        message: `queue depth ${opts.queueDepth} > ${THRESHOLDS.queueDepth}`,
        at: new Date().toISOString(),
      });
    }
    if (opts.errorRate !== undefined && opts.errorRate > THRESHOLDS.errorRate) {
      fired.push({
        code: 'ERROR_RATE_HIGH',
        severity: 'warning',
        message: `error rate ${opts.errorRate}`,
        at: new Date().toISOString(),
      });
    }
    if (
      opts.providerDownSeconds !== undefined &&
      opts.providerDownSeconds > THRESHOLDS.providerDownSeconds
    ) {
      fired.push({
        code: 'PROVIDER_UNAVAILABLE',
        severity: 'critical',
        message: `provider down ${opts.providerDownSeconds}s`,
        at: new Date().toISOString(),
      });
    }
    this.alerts.push(...fired);
    return fired;
  }

  list(): Alert[] {
    return this.alerts;
  }
}

export const alerting = new Alerting();
