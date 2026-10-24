/**
 * Standalone embed entry — built to a stable `dist/embed.js`.
 *
 * Loaded by third-party sites via the generated snippet (inline bootstrap that
 * pins the token on `window.__MESSANGER_TOKEN__` and dynamically imports this
 * module). Avoids `document.currentScript`, which is null inside module scripts.
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
  const w = window as unknown as { __MESSANGER_TOKEN__?: string };
  const token = (typeof w.__MESSANGER_TOKEN__ === 'string' && w.__MESSANGER_TOKEN__) ||
    (document.currentScript as HTMLScriptElement | null)?.dataset?.messangerToken;
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