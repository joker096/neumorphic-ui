import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Send, X, MessageSquare, UserRound } from 'lucide-react';
import { RelayClient } from '../../lib/company/relayClient';
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

interface WidgetMessage {
  id: string;
  text: string;
  own: boolean;
}

interface WidgetContact {
  name: string;
  email: string;
  phone: string;
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

type EmbedWidgetProps = {
  token: string;
  theme?: 'light' | 'dark';
};

const DEFAULT_ACCENT = '#6C5CE7';

export const EmbedWidget = ({ token, theme = 'light' }: EmbedWidgetProps) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [offline, setOffline] = useState(false);
  const [contact, setContact] = useState<WidgetContact>({ name: '', email: '', phone: '' });
  const [contactSent, setContactSent] = useState(false);
  const [sendingContact, setSendingContact] = useState(false);
  const relayRef = useRef<RelayClient | null>(null);
  const cfgRef = useRef<EmbedConfig | null>(null);

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
          { id: `r_${Date.now()}`, text, own: false },
        ]);
      } catch {
        /* ignore undecryptable */
      }
    });
    client.start();
    relayRef.current = client;
    return () => {
      client.stop();
      relayRef.current = null;
    };
  }, [token]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !cfgRef.current) return;
    const guest = getGuest();
    try {
      const sealed = await sealToChannel(guest, cfgRef.current.channelPubKeyB64, text);
      relayRef.current?.publish(sealed);
      setMessages((prev) => [...prev, { id: `s_${Date.now()}`, text, own: true }]);
    } catch {
      setOffline(true);
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
      relayRef.current?.publish(sealed);
      setContactSent(true);
      try {
        localStorage.setItem(contactSentKey(cfg.channelId), '1');
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
  const isDark = theme === 'dark';
  const panelBg = isDark ? 'bg-[var(--bg-tertiary)] text-white' : 'bg-white text-slate-900';
  const bubbleBg = 'bg-[var(--accent)] text-[var(--button-primary-text)]';
  const showContactForm = collectContact && !contactSent && open;

  return (
    <div
      className={`fixed bottom-4 font-sans z-[var(--z-critical)] flex flex-col pointer-events-auto ${
        position === 'bottom-left' ? 'left-4 items-start' : 'right-4 items-end'
      }`}
    >
      {open && (
        <div className={`w-[320px] max-w-[90vw] h-[440px] max-h-[80vh] rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden ${panelBg}`}>
          <div
            className={`px-4 py-3 flex items-center justify-between border-b border-[var(--border-color)]`}
            style={{ backgroundColor: accent, color: '#ffffff' }}
          >
            <span className="font-bold text-sm">{cfgRef.current?.label || t('embed.chat')}</span>
            <button onClick={() => setOpen(false)} aria-label={t('embed.close')} title={t('embed.close')} className="min-w-11 min-h-11 flex items-center justify-center rounded-xl cursor-pointer hover:bg-white/10 transition-colors text-white">
              <X size={18} />
            </button>
          </div>
          {showContactForm && (
            <div className="px-3 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
              <div className="flex items-center gap-2 text-xs font-bold mb-2">
                <UserRound size={13} />
                <span>{t('embed.contactTitle')}</span>
              </div>
              <input
                value={contact.name}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                placeholder={t('embed.contactName')}
                className="w-full min-h-10 rounded-lg px-3 mb-1.5 bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none"
              />
              <input
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                placeholder={t('embed.contactEmail')}
                type="email"
                className="w-full min-h-10 rounded-lg px-3 mb-1.5 bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none"
              />
              <input
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                placeholder={t('embed.contactPhone')}
                type="tel"
                className="w-full min-h-10 rounded-lg px-3 mb-2 bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => void sendContact()}
                  disabled={sendingContact}
                  className="flex-1 min-h-11 rounded-lg text-sm font-bold cursor-pointer text-white disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {t('embed.contactStart')}
                </button>
                <button
                  onClick={() => void sendContact()}
                  className="min-h-11 px-3 rounded-lg text-xs cursor-pointer opacity-70 hover:opacity-100"
                >
                  {t('embed.contactSkip')}
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {offline && (
              <div className="text-[11px] text-amber-500 text-center">{t('embed.offline')}</div>
            )}
            {greeting && messages.length === 0 && (
              <div className="self-start items-start flex flex-col max-w-[80%]">
                <div className="px-3 py-2 rounded-2xl text-sm bg-[var(--list-item-hover-bg)] text-[var(--text-primary)]">
                  {greeting}
                </div>
              </div>
            )}
            {messages.length === 0 && !greeting ? (
              <div className="text-center text-xs opacity-60 py-6">{t('embed.start')}</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex flex-col max-w-[80%] ${m.own ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${m.own ? bubbleBg : 'bg-[var(--list-item-hover-bg)] text-[var(--text-primary)]'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-[var(--border-color)] flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t('embed.typeMessage')}
              className="flex-1 min-h-11 rounded-xl px-3 bg-[var(--input-bg)] text-[var(--text-primary)] outline-none"
            />
            <button
              onClick={() => void send()}
              className="min-w-11 min-h-11 rounded-xl flex items-center justify-center cursor-pointer text-white"
              style={{ backgroundColor: accent }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('embed.openChat')}
        className="mt-3 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer text-white"
        style={{ backgroundColor: accent }}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

/** Mount helper used by the embed script: `mountEmbedWidget(el, token)`. */
export function mountEmbedWidget(el: HTMLElement, token: string): { unmount: () => void } {
  const root = createRoot(el);
  root.render(
    <I18nProvider>
      <EmbedWidget token={token} />
    </I18nProvider>,
  );
  return { unmount: () => root.unmount() };
}
