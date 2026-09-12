import { Download, X } from "lucide-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../constants/storage";

export interface InstallAppBannerProps {
  t: (key: string, fallback?: string) => string;
}

export function InstallAppBanner({ t }: InstallAppBannerProps) {
  const { canInstall, isStandalone, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useLocalStorage<boolean>(STORAGE_KEYS.PWA_INSTALL_DISMISSED, false);

  if (isStandalone || !canInstall || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-accent/10 text-accent"
    >
      <Download size={14} aria-hidden="true" className="shrink-0" />
      <span className="flex-1 min-w-0 truncate">
        {t("pwa.installHint", "Install the app to open it full-screen without the browser bar")}
      </span>
      <button
        type="button"
        onClick={() => promptInstall()}
        className="min-w-11 min-h-11 px-3 flex items-center justify-center rounded-lg bg-accent text-accent-foreground text-xs font-bold transition-all active:scale-95"
      >
        {t("pwa.installButton", "Install")}
      </button>
      <button
        type="button"
        aria-label={t("pwa.dismiss", "Dismiss install hint")}
        onClick={() => setDismissed(true)}
        className="min-w-11 min-h-11 flex items-center justify-center rounded-lg transition-colors hover:bg-accent/20"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
