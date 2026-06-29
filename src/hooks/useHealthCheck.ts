import { useState, useEffect, useCallback } from "react";
import { getErrorStats, clearErrorLog } from "../lib/errorHandling";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export function useHealthCheck(): {
  status: HealthStatus;
  stats: ReturnType<typeof getErrorStats>;
  clearErrors: () => void;
} {
  const [stats, setStats] = useState(getErrorStats());

  const checkStatus = useCallback((): HealthStatus => {
    const { critical, major, minor, total } = stats;

    if (critical > 3 || major > 5) return "unhealthy";
    if (critical > 0 || major > 0) return "degraded";
    return "healthy";
  }, [stats]);

  const [status, setStatus] = useState<HealthStatus>(() => checkStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = getErrorStats();
      setStats(newStats);
      const newStatus = checkStatus();
      setStatus(newStatus);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [checkStatus]);

  const clearErrors = useCallback(() => {
    clearErrorLog();
    setStats(getErrorStats());
  }, []);

  return {
    status,
    stats,
    clearErrors,
  };
}
