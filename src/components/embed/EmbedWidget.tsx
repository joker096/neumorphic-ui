import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Send, X, MessageSquare } from 'lucide-react';
import { RelayClient } from '../../lib/company/relayClient';
import type { RelayStatus } from '../../lib/company/relaySocket';
import {
  makeGuestIdentity,
  sealToChannel,
  openFromChannel,
  type SealedMessage,
} from '../../lib/embed/embedCrypto';
import { parseEmbedToken, type EmbedConfig } from '../../lib/embed/token';
import { b64encode } from '../../lib/crypto/cryptoCore';
import { useI18n, I18nProvider } from '../../lib/i18n';
import type { X25519KeyPair } from '../../lib/crypto/types';
import { EmbedContactForm, type WidgetContact } from './EmbedContactForm';

interface WidgetMessage {
  id: string;
  text: string;
  own: boolean;
  ts: number;
}

let guestIdentity: X25519KeyPair | null = null;
function getGuest(): X25519KeyPair {
  if (!guestIdentity) guestIdentity = makeGuestIdentity();
  return guestIdentity;
}

/** Stable per-channel marker so we only ask for contact details once per browser. */
function contactSentKey(channelId: string): string {
  return `messanger_contact_${channelId}`;
}

/** Persisted prefill for repeat visitors (name/email/phone last used on this channel). */
function prefillKey(channelId: string): string {
  return `messanger_prefill_${channelId}`;
}

const URL_RE = /(https?:\/\/[^\s]+)/g;
/** Render message text, turning bare links into real <a> anchors (new tab). */
function autolink(text: string): ReactNode {
  const parts = text.split(URL_RE);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="ew-link"
        onClick={(e) => e.stopPropagation()}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

type EmbedWidgetProps = {
  token: string;
  theme?: 'light' | 'dark';
};

const DEFAULT_ACCENT = '#6C5CE7';
const BRAND = 'Mess&Anger';

export const EmbedWidget = ({ token, theme = 'light' }: EmbedWidgetProps) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [offline, setOffline] = useState(false);
  const [relayStatus, setRelayStatus] = useState<RelayStatus>('connecting');
  const [contact, setContact] = useState<WidgetContact>({ name: '', email: '', phone: '' });
  const [contactSent, setContactSent] = useState(false);
  const [sendingContact, setSendingContact] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const relayRef = useRef<RelayClient | null>(null);
  const cfgRef = useRef<EmbedConfig | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    setUnread(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll('button, input, textarea, a[href], [tabindex]:not([tabindex="-1"])'),
        ).filter((el) => !(el as HTMLElement).hasAttribute('disabled')) as HTMLElement[];
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Auto-scroll to the newest message whenever the thread grows while open.
  useEffect(() => {
    if (!open) return;
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    let cfg: EmbedConfig;
    try {
      cfg = parseEmbedToken(token);
    } catch {
      setOffline(true);
      return;
    }
    cfgRef.current = cfg;
    try {
      if (typeof localStorage !== 'undefined') {
        setContactSent(localStorage.getItem(contactSentKey(cfg.channelId)) === '1');
        try {
          const saved = localStorage.getItem(prefillKey(cfg.channelId));
          if (saved) {
            const p = JSON.parse(saved) as Partial<WidgetContact>;
            setContact((c) => ({ ...c, ...p }));
          }
        } catch {
          /* ignore malformed prefill */
        }
      }
    } catch {
      /* storage unavailable */
    }
    const guest = getGuest();
    const client = new RelayClient(`company:${cfg.companyId}:channel:${cfg.channelId}`);
    client.onMessage(async (payload: any) => {
      try {
        const sealed = payload as SealedMessage;
        const text = await openFromChannel(b64encode(guest.secretKey), sealed);
        setMessages((prev) => [
          ...prev,
          { id: `r_${Date.now()}`, text, own: false, ts: Date.now() },
        ]);
        if (!openRef.current) {
          setUnread((n) => n + 1);
          setToast(text.length > 80 ? `${text.slice(0, 80)}…` : text);
          if (toastTimer.current) window.clearTimeout(toastTimer.current);
          toastTimer.current = window.setTimeout(() => setToast(null), 4000);
        }
      } catch {
        /* ignore undecryptable */
      }
    });
    client.onStatus(setRelayStatus);
    client.start();
    relayRef.current = client;
    return () => {
      client.stop();
      relayRef.current = null;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [token]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !cfgRef.current) return;
    const guest = getGuest();
    try {
      const sealed = await sealToChannel(guest, cfgRef.current.channelPubKeyB64, text);
      // `publish` is the delivery proof: a dropped frame (relay down) must not
      // become a fake "sent" bubble — the draft stays for the retry.
      if (!relayRef.current?.publish(sealed)) return;
      setMessages((prev) => [...prev, { id: `s_${Date.now()}`, text, own: true, ts: Date.now() }]);
    } catch {
      setOffline(true);
      return; // keep the draft — the message was never delivered
    }
    setDraft('');
  };

  const sendContact = async () => {
    const cfg = cfgRef.current;
    if (!cfg || sendingContact) return;
    if (!contact.name && !contact.email && !contact.phone) {
      setContactSent(true); // visitor skipped — don't nag again
      try {
        localStorage.setItem(contactSentKey(cfg.channelId), '1');
      } catch {
        /* ignore */
      }
      return;
    }
    setSendingContact(true);
    try {
      const envelope = {
        v: 1,
        kind: 'contact',
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        pageUrl: typeof location !== 'undefined' ? location.href : undefined,
        pageTitle: typeof document !== 'undefined' ? document.title : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        ts: Date.now(),
      };
      const sealed = await sealToChannel(getGuest(), cfg.channelPubKeyB64, JSON.stringify(envelope));
      // Same delivery proof as `send`: an undelivered contact form must stay in
      // the form (and keep nagging the visitor) instead of being remembered as
      // "sent" in localStorage.
      if (!relayRef.current?.publish(sealed)) return;
      setContactSent(true);
      try {
        localStorage.setItem(contactSentKey(cfg.channelId), '1');
        localStorage.setItem(
          prefillKey(cfg.channelId),
          JSON.stringify({ name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim() }),
        );
      } catch {
        /* ignore */
      }
    } catch {
      setOffline(true);
    } finally {
      setSendingContact(false);
    }
  };

  const collectContact = cfgRef.current?.config?.collectContact ?? true;
  const accent = cfgRef.current?.config?.accent || DEFAULT_ACCENT;
  const position = cfgRef.current?.config?.position || 'bottom-right';
  const greeting = cfgRef.current?.config?.greeting;
  const hideBrand = cfgRef.current?.config?.hideBrand ?? false;
  const title = cfgRef.current?.config?.title || cfgRef.current?.label || t('embed.chat');
  const isDark = theme === 'dark';
  const showContactForm = collectContact && !contactSent && open;
  // Relay down / still handshaking → show the note, keep the composer usable so
  // the visitor can prepare a message instead of writing into a black hole.
  const relayNote = offline
    ? t('embed.offline')
    : relayStatus === 'connecting'
      ? t('embed.connecting', 'connecting…')
      : relayStatus === 'offline'
        ? t('embed.offline')
        : null;

  return (
    <div
      data-ew-theme={isDark ? 'dark' : 'light'}
      data-ew-pos={position}
      className={`ew-root ${position === 'bottom-left' ? 'ew-bot-left' : 'ew-bot-right'}`}
      style={{ '--ew-accent': accent } as CSSProperties}
    >
      {open && (
        <div className="ew-panel" ref={panelRef}>
          <div
            className="ew-header"
            style={{ backgroundColor: accent, color: '#ffffff' }}
          >
            <div className="ew-header-left">
              <div className="ew-header-avatar">
                {title.charAt(0).toUpperCase()}
              </div>
              <span className="ew-header-title">{title}</span>
              {relayStatus === 'online' && <div className="ew-online-dot" aria-label="online" />}
            </div>
            <button onClick={() => setOpen(false)} aria-label={t('embed.close')} title={t('embed.close')} className="ew-close">
              <X size={18} />
            </button>
          </div>
          {showContactForm && (
            <EmbedContactForm
              t={t}
              accent={accent}
              contact={contact}
              onChange={(field, value) =>
                setContact((c) => ({ ...c, [field]: value }))
              }
              onSend={() => void sendContact()}
              sending={sendingContact}
            />
          )}
          <div className="ew-messages" ref={messagesRef} aria-live="polite">
            {relayNote && (
              <div className="ew-offline-note">{relayNote}</div>
            )}
            {greeting && messages.length === 0 && (
              <div className="ew-msg-row ew-msg-other">
                <div className="ew-msg">
                  {autolink(greeting)}
                </div>
              </div>
            )}
            {messages.length === 0 && !greeting ? (
              <div className="ew-empty">{t('embed.start')}</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`ew-msg-row ${m.own ? 'ew-msg-own' : 'ew-msg-other'}`}>
                  <div className={`ew-msg ${m.own ? 'ew-msg-own-bubble' : ''}`}>
                    {autolink(m.text)}
                  </div>
                  <div className="ew-time">
                    {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="ew-composer">
            <input
              aria-label={t('embed.typeMessage')}
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t('embed.typeMessage')}
              className="ew-input"
            />
            <button
              onClick={() => void send()}
              disabled={!draft.trim()}
              aria-label={t('embed.send', 'Send')}
              title={t('embed.send', 'Send')}
              className="ew-send"
              style={{ backgroundColor: accent }}
            >
              <Send size={16} />
            </button>
          </div>
          {!hideBrand && (
            <div className="ew-footer">
              {t('embed.poweredBy', `Powered by `)}<b>{BRAND}</b>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t('embed.close') : t('embed.openChat')}
        className="ew-fab"
        style={{ backgroundColor: accent }}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
        {!open && unread > 0 && <span className="ew-fab-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {toast && !open && (
        <button className="ew-toast" onClick={() => setOpen(true)} aria-label={t('embed.openChat')}>
          {toast}
        </button>
      )}
    </div>
  );
};

/** Mount helper used by the embed script: `mountEmbedWidget(el, token)`. */
export function mountEmbedWidget(
  el: HTMLElement,
  token: string,
  theme?: 'light' | 'dark',
): { unmount: () => void } {
  const root = createRoot(el);
  root.render(
    <I18nProvider>
      <EmbedWidget token={token} theme={theme} />
    </I18nProvider>,
  );
  return { unmount: () => root.unmount() };
}
