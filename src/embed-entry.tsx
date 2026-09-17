/**
 * Standalone embed entry — built to a stable `dist/embed.js`.
 *
 * Loaded by third-party sites via the generated snippet:
 *   <script src="/embed.js" data-messanger-token="…" async></script>
 *
 * MUST stay dependency-light and side-effect driven: no app store, no router.
 */

import embedStyles from './embed.css?inline';
import { mountEmbedWidget } from './components/embed/EmbedWidget';

function ensureStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('messanger-embed-style')) return;
  const style = document.createElement('style');
  style.id = 'messanger-embed-style';
  style.textContent = embedStyles;
  document.head.appendChild(style);
}

function detectTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function boot(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  const token = script?.dataset?.messangerToken;
  if (!token) return;

  ensureStyles();

  const host = document.createElement('div');
  host.setAttribute('data-messanger-widget', '');
  host.style.position = 'fixed';
  host.style.bottom = '0';
  host.style.right = '0';
  host.style.zIndex = '2147483000';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  mountEmbedWidget(host, token, detectTheme());
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}