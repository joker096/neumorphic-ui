import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export interface OfflineBannerProps {
  t: (key: string, fallback?: string) => string;
}

export function OfflineBanner({ t }: OfflineBannerProps) {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [lastSyncAt, setLastSyncAt] = useState<number>(() => Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setLastSyncAt(Date.now());
    };
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  const elapsedMin = lastSyncAt > 0 ? Math.floor((Date.now() - lastSyncAt) / 60000) : 0;
  const synced =
    lastSyncAt === 0
      ? null
      : elapsedMin < 1
        ? t("offline.justNow", "just now")
        : `${elapsedMin} ${t("offline.minutesAgo", "min ago")}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400"
    >
      <WifiOff size={14} aria-hidden="true" />
      <span>{t("offline.banner", "Offline")}</span>
      {synced && <span>· {t("offline.lastSynced", "Last synced")} {synced}</span>}
    </div>
  );
}
