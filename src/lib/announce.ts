/**
 * Screen-reader announcement channel. `AppShell` renders a visually-hidden
 * `<div id="sr-region" role="status" aria-live="polite">`; writing text there
 * makes toasts/status changes audible to assistive tech. This helper is
 * idempotent and safe to call anywhere (no-op when the region is absent).
 */
let lastAnnouncement = "";

export function announce(text: string, debounceMs = 500): void {
  const region = document.getElementById("sr-region");
  if (!region) return;
  if (text === lastAnnouncement) return;
  lastAnnouncement = text;
  window.setTimeout(() => {
    region.textContent = "";
  }, debounceMs);
  region.textContent = text;
}
