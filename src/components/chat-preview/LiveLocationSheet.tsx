import { useState } from "react";
import { Radio } from "lucide-react";
import { LIVE_LOCATION_DEFAULT_MS, formatCountdown } from "../../constants/liveLocation";

/**
 * Consent gate for live location.
 *
 * A continuous position stream is a far bigger disclosure than a one-shot pin,
 * so the user picks the window and the precision explicitly. Approximate is the
 * default, and the panel states plainly what the peer receives.
 */
const DURATIONS: { ms: number; key: string; fallback: string }[] = [
  { ms: 15 * 60_000, key: "chat.liveFor15m", fallback: "15 minutes" },
  { ms: 60 * 60_000, key: "chat.liveFor1h", fallback: "1 hour" },
  { ms: 8 * 60 * 60_000, key: "chat.liveFor8h", fallback: "8 hours" },
];

export interface LiveLocationSheetProps {
  t: (key: string, opts?: any) => string;
  onCancel: () => void;
  onStart: (opts: { durationMs: number; approximate: boolean }) => void;
}

export function LiveLocationSheet({ t, onCancel, onStart }: LiveLocationSheetProps) {
  const [durationMs, setDurationMs] = useState(LIVE_LOCATION_DEFAULT_MS);
  const [approximate, setApproximate] = useState(true);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={t("chat.liveLocation", "Live location")}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
        <div className="flex items-center gap-2 mb-1">
          <Radio size={18} className="text-rose-500 flex-shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-semibold">{t("chat.liveLocation", "Live location")}</h3>
        </div>
        <p className="text-xs opacity-70 mb-1">
          {approximate
            ? t("chat.liveLocationApproxHint", "Your position is blurred to about 100 m")
            : t("chat.liveLocationExactHint", "Your exact position is shared")}
        </p>
        <p className="text-xs opacity-60 mb-3" data-testid="live-duration-summary">
          {formatCountdown(durationMs)}
        </p>

        <div className="flex gap-1.5 mb-3">
          {DURATIONS.map((d) => (
            <button
              key={d.ms}
              type="button"
              onClick={() => setDurationMs(d.ms)}
              aria-pressed={durationMs === d.ms}
              className={`min-w-11 min-h-11 flex-1 rounded-lg text-xs font-medium transition-colors ${
                durationMs === d.ms
                  ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              }`}
            >
              {t(d.key, d.fallback)}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 min-h-11 cursor-pointer text-sm mb-3">
          <input
            type="checkbox"
            checked={approximate}
            onChange={(e) => setApproximate(e.target.checked)}
            className="w-4 h-4"
          />
          {t("chat.locationApproximate", "Approximate location")}
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-w-11 min-h-11 flex-1 rounded-lg border border-[var(--border-color)] text-sm"
          >
            {t("chat.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => onStart({ durationMs, approximate })}
            className="min-w-11 min-h-11 flex-1 rounded-lg bg-[var(--accent)] text-[var(--ink-on-saturate)] text-sm font-semibold"
          >
            {t("chat.shareLiveLocation", "Share")}
          </button>
        </div>
      </div>
    </div>
  );
}
