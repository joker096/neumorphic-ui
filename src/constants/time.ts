export const MINUTE_MS = 60_000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS

// "Active now" boundary for online-status dots and last-seen labels.
export const ACTIVE_NOW_THRESHOLD_MS = MINUTE_MS

// Default self-destruct timer options (PrivacySection values → TTL).
export const SELF_DESTRUCT_MS: Record<string, number> = {
  '1 min': MINUTE_MS,
  '5 min': 5 * MINUTE_MS,
  '1 hour': HOUR_MS,
  '1 day': DAY_MS,
}