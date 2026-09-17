/**
 * Standalone embed entry — built to a stable `dist/embed.js`.
 *
 * Loaded by third-party sites via the generated snippet:
 *   <script src="/embed.js" data-messanger-token="…" async></script>
 *
 * MUST stay dependency-light and side-effect driven: no app store, no router.
 */

import { mountEmbedWidget } from './components/embed/EmbedWidget';

function boot(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  const token = script?.dataset?.messangerToken;
  if (!token) return;

  const host = document.createElement('div');
  host.setAttribute('data-messanger-widget', '');
  host.style.position = 'fixed';
  host.style.bottom = '0';
  host.style.right = '0';
  host.style.zIndex = '2147483000';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  mountEmbedWidget(host, token);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}