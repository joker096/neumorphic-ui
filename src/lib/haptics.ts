/**
 * Best-effort haptic feedback (Telegram-parity: short buzz on send and on
 * confirm actions). `navigator.vibrate` is absent on desktop and in some web
 * views — call is guarded and never throws.
 */
export function vibrate(pattern: number | number[] = 10): void {
  try {
    if (navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* restricted context — no-op */
  }
}
