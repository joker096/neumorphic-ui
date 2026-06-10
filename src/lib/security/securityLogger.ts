import { useState, useEffect } from 'react';

// Security Logger - Logs security events for monitoring and analysis

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SPAM_DETECTED'
  | 'XSS_ATTEMPT'
  | 'SECURE_WIPE'
  | 'KEY_ROTATION'
  | 'HANDSHAKE_COMPLETE'
  | 'MESSAGE_ENCRYPTED'
  | 'MESSAGE_DECRYPTED'
  | 'BACKUP_CREATED'
  | 'BACKUP_RESTORED'
  | 'DEVICE_FINGERPRINT_CHANGED'
  | 'SPAM_BLOCKED'
  | 'FIREWALL_BLOCK'
  | 'SECURITY_SCAN'
  | 'ANOMALY_DETECTED'
  | 'SESSION_INVALIDATED'
  | 'DATA_EXPORTED'
  | 'DATA_DELETED'
  | 'INTEGRITY_VIOLATION'
  | 'CIPHERTEXT_MALLEATION'
  | 'KEY_EXPOSURE'
  | 'MEMLEAK_DETECTED'
  | 'MEMORY_VIOLATION'
  | 'UNAUTHORIZED_ACCESS'
  | 'COUNTERMEASURE_ACTIVATED';

export interface SecurityLogEntry {
  id: string;
  timestamp: number;
  type: SecurityEventType;
  severity: 'info' | 'warning' | 'critical' | 'blocked';
  message: string;
  metadata?: Record<string, unknown>;
  source?: string;
}

const SECURITY_LOG_KEY = '__mess_security_log';
const MAX_LOG_ENTRIES = 1000;

const severityMap: Record<SecurityEventType, { severity: SecurityLogEntry['severity']; defaultMsg: string }> = {
  AUTH_FAILURE: { severity: 'critical', defaultMsg: 'Authentication failure detected' },
  RATE_LIMIT_EXCEEDED: { severity: 'warning', defaultMsg: 'Rate limit exceeded' },
  SPAM_DETECTED: { severity: 'critical', defaultMsg: 'Spam detected' },
  XSS_ATTEMPT: { severity: 'critical', defaultMsg: 'XSS attempt detected' },
  SECURE_WIPE: { severity: 'critical', defaultMsg: 'Secure wipe initiated' },
  KEY_ROTATION: { severity: 'info', defaultMsg: 'Key rotation performed' },
  HANDSHAKE_COMPLETE: { severity: 'info', defaultMsg: 'Handshake completed' },
  MESSAGE_ENCRYPTED: { severity: 'info', defaultMsg: 'Message encrypted' },
  MESSAGE_DECRYPTED: { severity: 'info', defaultMsg: 'Message decrypted' },
  BACKUP_CREATED: { severity: 'info', defaultMsg: 'Backup created' },
  BACKUP_RESTORED: { severity: 'info', defaultMsg: 'Backup restored' },
  DEVICE_FINGERPRINT_CHANGED: { severity: 'warning', defaultMsg: 'Device fingerprint changed' },
  SPAM_BLOCKED: { severity: 'blocked', defaultMsg: 'Spam blocked' },
  FIREWALL_BLOCK: { severity: 'blocked', defaultMsg: 'Firewall blocked request' },
  SECURITY_SCAN: { severity: 'info', defaultMsg: 'Security scan performed' },
  ANOMALY_DETECTED: { severity: 'warning', defaultMsg: 'Anomaly detected' },
  SESSION_INVALIDATED: { severity: 'warning', defaultMsg: 'Session invalidated' },
  DATA_EXPORTED: { severity: 'info', defaultMsg: 'Data exported' },
  DATA_DELETED: { severity: 'info', defaultMsg: 'Data deleted' },
  INTEGRITY_VIOLATION: { severity: 'critical', defaultMsg: 'Integrity violation detected' },
  CIPHERTEXT_MALLEATION: { severity: 'critical', defaultMsg: 'Ciphertext malleation detected' },
  KEY_EXPOSURE: { severity: 'critical', defaultMsg: 'Key exposure detected' },
  MEMLEAK_DETECTED: { severity: 'warning', defaultMsg: 'Memory leak detected' },
  MEMORY_VIOLATION: { severity: 'critical', defaultMsg: 'Memory violation detected' },
  UNAUTHORIZED_ACCESS: { severity: 'critical', defaultMsg: 'Unauthorized access detected' },
  COUNTERMEASURE_ACTIVATED: { severity: 'critical', defaultMsg: 'Countermeasure activated' },
};

export const securityLogger = {
  _log: [] as SecurityLogEntry[],

  log(event: SecurityEventType, message?: string, metadata?: Record<string, unknown>, source?: string): SecurityLogEntry {
    const entry: SecurityLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: event,
      severity: severityMap[event]?.severity ?? 'warning',
      message: message || severityMap[event]?.defaultMsg || 'Security event',
      metadata,
      source: source || 'unknown',
    };

    this._log.push(entry);

    // Trim log to max entries
    if (this._log.length > MAX_LOG_ENTRIES) {
      this._log = this._log.slice(-MAX_LOG_ENTRIES);
    }

    return entry;
  },

  getLogs(filter?: {
    type?: SecurityEventType;
    severity?: SecurityLogEntry['severity'];
    since?: number;
    until?: number;
    source?: string;
  }): SecurityLogEntry[] {
    let result = [...this._log];

    if (filter?.type) {
      result = result.filter((e) => e.type === filter.type);
    }
    if (filter?.severity) {
      result = result.filter((e) => e.severity === filter.severity);
    }
    if (filter?.since) {
      result = result.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter?.until) {
      result = result.filter((e) => e.timestamp <= filter.until!);
    }
    if (filter?.source) {
      result = result.filter((e) => e.source === filter.source);
    }

    return result;
  },

  clearLogs(): void {
    this._log = [];
  },

  getMetrics(): { total: number; bySeverity: Record<string, number>; byType: Record<string, number> } {
    const total = this._log.length;
    const bySeverity = {} as Record<string, number>;
    const byType = {} as Record<string, number>;

    for (const entry of this._log) {
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
      byType[entry.type] = (byType[entry.type] || 0) + 1;
    }

    return { total, bySeverity, byType };
  },

  saveToStorage(): void {
    try {
      localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(this._log.slice(-MAX_LOG_ENTRIES)));
    } catch {
      // Storage full or not available
    }
  },

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(SECURITY_LOG_KEY);
      if (stored) {
        this._log = JSON.parse(stored);
      }
    } catch {
      this._log = [];
    }
  },
};

export function useSecurityLogs(initializeFromStorage = true) {
  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);

  useEffect(() => {
    if (initializeFromStorage) {
      securityLogger.loadFromStorage();
    }
    setLogs(securityLogger.getLogs());
  }, [initializeFromStorage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(securityLogger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { logs };
}
