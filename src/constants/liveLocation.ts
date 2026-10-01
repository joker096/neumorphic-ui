/**
 * Live location sharing — bounds, defaults and coordinate blurring.
 *
 * Live location is the most sensitive thing this app can emit: it is a
 * continuous stream of the user's real position, not a one-shot pin. The
 * defaults below are therefore chosen to leak the least: the shortest useful
 * window, an absolute upper bound a caller cannot talk its way past, and
 * coordinate blurring on by default.
 */

/** Shortest share anyone may request — below this a pin is the right tool. */
export const LIVE_LOCATION_MIN_MS = 60_000;

/** Hard upper bound. Callers may request less, never more. */
export const LIVE_LOCATION_MAX_MS = 8 * 60 * 60 * 1000;

/** What the consent screen pre-selects. */
export const LIVE_LOCATION_DEFAULT_MS = 60 * 60 * 1000;

/**
 * Blur radius applied when the share is not marked exact. */
export const LIVE_LOCATION_APPROXIMATE_METERS = 100;

/**
 * Countdown for the share window, as `M:SS`, widening to `H:MM:SS` past an hour.
 *
 * Deliberately not `mediaUtils.formatTime`: that is a media-elapsed formatter and
 * renders this window as a meaningless `480:00`. Expired or non-finite input
 * floors at `0:00` so the card can never display a negative remaining time.
 */
export const formatCountdown = (remainingMs: number): string => {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return '0:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
  const tail = `${mm}:${seconds}`;
  return hours > 0 ? `${hours}:${tail}` : tail;
};

/** Metres per degree of latitude; good to ~0.1% for this purpose. */
const METERS_PER_DEGREE_LAT = 111_320;

/** Geolocation watch cadence. */
export const LIVE_LOCATION_WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5_000,
  timeout: 20_000,
};

/**
 * Force a requested duration into the allowed window.
 *
 * `Infinity` means "as long as allowed" and therefore resolves to the hard
 * bound — otherwise the bound would be unreachable and effectively fictional.
 * `NaN` carries no intent, so it falls back to the default rather than reaching
 * `setTimeout`, which would coerce it to 0 and fire immediately.
 */
export const clampLiveDurationMs = (requestedMs: number): number => {
  if (Number.isNaN(requestedMs) || !Number.isFinite(requestedMs) && requestedMs < 0) {
    return LIVE_LOCATION_DEFAULT_MS;
  }
  if (!Number.isFinite(requestedMs)) return LIVE_LOCATION_MAX_MS;
  return Math.min(LIVE_LOCATION_MAX_MS, Math.max(LIVE_LOCATION_MIN_MS, Math.floor(requestedMs)));
};

/**
 * Blur a coordinate to roughly `meters` precision, keeping the meridian and
 * parallel correct for the latitude. A point at the pole has a parallel of
 * ~0 length, so the divisor is clamped instead of dividing by zero.
 */
export const blurCoordinate = (
  latitude: number,
  longitude: number,
  meters: number = LIVE_LOCATION_APPROXIMATE_METERS,
): { latitude: number; longitude: number } => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { latitude, longitude };
  }
  const latStep = meters / METERS_PER_DEGREE_LAT;
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  // cosLat -> 0 at the poles; 0.01 keeps the parallel step bounded (~10 km)
  // instead of dividing by zero.
  const lngStep = meters / (METERS_PER_DEGREE_LAT * Math.max(0.01, Math.abs(cosLat)));
  return {
    latitude: Math.round(latitude / latStep) * latStep,
    longitude: Math.round(longitude / lngStep) * lngStep,
  };
};
