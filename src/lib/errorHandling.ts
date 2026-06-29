// Error severity classification
export enum ErrorSeverity {
  CRITICAL = "critical",    // App stops — needs recovery
  MAJOR = "major",          // Feature breaks — degrade gracefully
  MINOR = "minor",          // Cosmetic — log and continue
}

export type ErrorRecord = {
  id: string;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
  context?: string;
  retryable: boolean;
  component?: string;
};

let errorLog: ErrorRecord[] = [];
let errorListeners: Set<() => void> = new Set();

export function generateErrorId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function classifyError(error: unknown, context?: string): ErrorRecord {
  const message = error instanceof Error ? error.message : String(error);

  // Classify severity based on error patterns
  let severity: ErrorSeverity;
  let retryable = false;

  if (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("fetch") ||
    message.includes("websocket") ||
    message.includes("WebSocket") ||
    message.includes("transport")
  ) {
    severity = ErrorSeverity.MAJOR;
    retryable = true;
  } else if (
    message.includes("storage") ||
    message.includes("indexeddb") ||
    message.includes("idb") ||
    message.includes("storage")
  ) {
    severity = ErrorSeverity.CRITICAL;
    retryable = true;
  } else if (message.includes("crypto") || message.includes("encrypt") || message.includes("decrypt")) {
    severity = ErrorSeverity.CRITICAL;
    retryable = true;
  } else if (message.includes("render") || message.includes("react") || message.includes("component")) {
    severity = ErrorSeverity.MINOR;
    retryable = true;
  } else {
    severity = ErrorSeverity.MINOR;
    retryable = false;
  }

  return {
    id: generateErrorId(),
    severity,
    message: message.slice(0, 500), // Truncate long messages
    timestamp: Date.now(),
    context,
    retryable,
    component: context,
  };
}

export function logError(error: unknown, context?: string): ErrorRecord {
  const record = classifyError(error, context);
  errorLog.push(record);

  // Keep only last 100 errors
  if (errorLog.length > 100) {
    errorLog = errorLog.slice(-100);
  }

  // Notify listeners
  errorListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("[GlobalErrorHandler] Listener error:", e);
    }
  });

  // Also log to console
  console.error(`[Error:${record.severity}]`, record.message, record);

  return record;
}

export function getErrorLog(): ErrorRecord[] {
  return [...errorLog];
}

export function clearErrorLog(): void {
  errorLog = [];
  errorListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("[GlobalErrorHandler] Clear listener error:", e);
    }
  });
}

export function subscribeToErrors(listener: () => void): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function getErrorStats(): {
  total: number;
  critical: number;
  major: number;
  minor: number;
  retryable: number;
} {
  return {
    total: errorLog.length,
    critical: errorLog.filter((e) => e.severity === ErrorSeverity.CRITICAL).length,
    major: errorLog.filter((e) => e.severity === ErrorSeverity.MAJOR).length,
    minor: errorLog.filter((e) => e.severity === ErrorSeverity.MINOR).length,
    retryable: errorLog.filter((e) => e.retryable).length,
  };
}
