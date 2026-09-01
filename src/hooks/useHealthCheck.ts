import { useState, useEffect, useCallback } from "react";
import { getErrorStats, clearErrorLog } from "../lib/errorHandling";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

function statusFromStats(stats: ReturnType<typeof getErrorStats>): HealthStatus {
  const { critical, major } = stats;
  if (critical > 3 || major > 5) return "unhealthy";
  if (critical > 0 || major > 0) return "degraded";
  return "healthy";
}

export function useHealthCheck(): {
  status: HealthStatus;
  stats: ReturnType<typeof getErrorStats>;
  clearErrors: () => void;
} {
  const [stats, setStats] = useState(getErrorStats());

  const [status, setStatus] = useState<HealthStatus>(() => statusFromStats(getErrorStats()));

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = getErrorStats();
      setStats(newStats);
      setStatus(statusFromStats(newStats));
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const clearErrors = useCallback(() => {
    clearErrorLog();
    const newStats = getErrorStats();
    setStats(newStats);
    setStatus(statusFromStats(newStats));
  }, []);

  return {
    status,
    stats,
    clearErrors,
  };
}
