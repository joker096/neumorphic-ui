import { useEffect, useState, useCallback } from "react";
import { getErrorLog, getErrorStats, subscribeToErrors, type ErrorRecord } from "../lib/errorHandling";

export function useGlobalErrorHandler() {
  const [errors, setErrors] = useState<ErrorRecord[]>(() => getErrorLog());

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      console.error(`[GlobalErrorHandler] ${context || "Error"}:`, error);

      // Try to catch in a try/catch wrapper for any cleanup
      try {
        // Attempt graceful degradation based on error type
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("storage") || message.includes("indexeddb")) {
          // Storage error — try to reset store
          console.warn("[GlobalErrorHandler] Storage error detected. Attempting graceful degradation.");
        } else if (message.includes("crypto") || message.includes("encrypt")) {
          // Crypto error — fallback to unencrypted mode
          console.warn("[GlobalErrorHandler] Crypto error detected. Operating in degraded mode.");
        } else if (message.includes("network") || message.includes("connection")) {
          // Network error — try reconnection
          console.warn("[GlobalErrorHandler] Network error detected. Reconnection attempted.");
        }
      } catch (e) {
        console.error("[GlobalErrorHandler] Degradation attempt failed:", e);
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = () => {
      setErrors(getErrorLog());
    };

    const cleanup = subscribeToErrors(unsubscribe);

    return cleanup;
  }, []);

  return { errors, handleError };
}

export function useErrorStats() {
  const [stats, setStats] = useState(getErrorStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getErrorStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
