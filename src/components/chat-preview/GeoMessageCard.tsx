import { useEffect, useState } from "react";
import { MapPin, Radio } from "lucide-react";
import { formatCountdown } from "../../constants/liveLocation";

/** Ticks the live card once per second; anything coarser makes the timer jump. */
const TICK_MS = 1_000;

interface GeoMessageCardProps {
  msg: any;
  t: (key: string, fallback?: string | Record<string, string | number>) => string;
}

/**
 * One-off pin or a live-location share.
 *
 * Liveness is decided by `expiresAt`, not by the `isLive` flag alone: a sender
 * can disappear without ever sending a stop frame, and a card that trusted the
 * flag would keep claiming to be live forever. A flag with no usable deadline
 * is therefore treated as expired rather than as live.
 */
export function GeoMessageCard({ msg, t }: GeoMessageCardProps) {
  const lat = Number(msg.lat);
  const lng = Number(msg.lng);
  const claimsLive = msg.isLive === true;
  const approximate = msg.approximate === true;
  const expiresAt = Number(msg.expiresAt);
  const [now, setNow] = useState(() => Date.now());

  const live = claimsLive && Number.isFinite(expiresAt) && expiresAt > now;

  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [live, expiresAt]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
  const remaining = formatCountdown(expiresAt - now);
  const ended = claimsLive && !live;

  return (
    <div className="flex items-center gap-3 rounded-xl border px-3 py-2.5 mb-2 border-[var(--border-color)]">
      <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-500">
        {live ? <Radio size={20} aria-hidden="true" /> : <MapPin size={20} aria-hidden="true" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{coords}</div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--accent)] underline hover:opacity-80 break-all"
        >
          {t("chat.openInMap", "Open in map")}
        </a>
        {live && (
          <div
            className="text-xs text-rose-500 font-medium mt-0.5"
            aria-label={t("chat.liveLocationEndsIn", { time: remaining })}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse" aria-hidden="true" />
            {t("chat.liveLocation", "Live location")} · {remaining}
          </div>
        )}
        {!live && ended && (
          <div className="text-xs opacity-70 mt-0.5">{t("chat.liveLocationEnded", "Live location ended")}</div>
        )}
        {approximate && (
          <div className="text-xs opacity-70 mt-0.5">{t("chat.locationApproximate", "Approximate location")}</div>
        )}
      </div>
    </div>
  );
}
