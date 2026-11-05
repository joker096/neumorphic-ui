import { Download } from "lucide-react";
import type { PwaInstallPromptState } from "../../hooks/pwa/usePwaInstallPrompt";

export interface PwaInstallBannerProps {
  state: PwaInstallPromptState;
  t: (key: string, fallback?: string) => string;
}

/**
 * Slim top-of-app banner that nags the user to install the PWA.
 *
 * - Android / Chrome: one-tap install via `beforeinstallprompt`.
 * - iOS Safari: a text hint pointing to "Share → Add to Home Screen".
 * - Dismissal is persisted so it only shows once per browser profile.
 */
export function PwaInstallBanner({ state, t }: PwaInstallBannerProps) {
  if (!state.visible) return null;

  return (
    <div
      role="region"
      aria-label={t("pwa.installHint", "Install this app")}
      className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Download size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate">
          {state.isIos
            ? t("pwa.iosHint", "Share → Add to Home Screen for full-screen mode")
            : t("pwa.installHint", "Add Mess&Anger to your home screen for full-screen mode")}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {state.canPrompt && (
          <button
            type="button"
            onClick={() => void state.promptInstall()}
            className="rounded px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
          >
            {t("pwa.installBtn", "Install")}
          </button>
        )}
        <button
          type="button"
          onClick={state.dismiss}
          aria-label={t("pwa.dismiss", "Dismiss")}
          className="rounded px-1.5 py-0.5 hover:bg-blue-500/20 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
