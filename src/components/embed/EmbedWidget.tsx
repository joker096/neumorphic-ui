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
  const showContactForm = collectContact && !contactSent && open;

  return (
    <div
      data-ew-theme={isDark ? 'dark' : 'light'}
      data-ew-pos={position}
      className={`ew-root ${position === 'bottom-left' ? 'ew-bot-left' : 'ew-bot-right'}`}
    >
      {open && (
        <div className="ew-panel">
          <div
            className="ew-header"
            style={{ backgroundColor: accent, color: '#ffffff' }}
          >
            <span className="ew-header-title">{cfgRef.current?.label || t('embed.chat')}</span>
            <button onClick={() => setOpen(false)} aria-label={t('embed.close')} title={t('embed.close')} className="ew-close">
              <X size={18} />
            </button>
          </div>
          {showContactForm && (
            <div className="ew-contact">
              <div className="ew-contact-head">
                <UserRound size={13} />
                <span>{t('embed.contactTitle')}</span>
              </div>
              <input
                value={contact.name}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                placeholder={t('embed.contactName')}
                className="ew-field"
              />
              <input
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                placeholder={t('embed.contactEmail')}
                type="email"
                className="ew-field"
              />
              <input
                value={contact.phone}
                onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                placeholder={t('embed.contactPhone')}
                type="tel"
                className="ew-field"
              />
              <div className="ew-contact-actions">
                <button
                  onClick={() => void sendContact()}
                  disabled={sendingContact}
                  className="ew-btn-primary"
                  style={{ backgroundColor: accent }}
                >
                  {t('embed.contactStart')}
                </button>
                <button
                  onClick={() => void sendContact()}
                  className="ew-btn-ghost"
                >
                  {t('embed.contactSkip')}
                </button>
              </div>
            </div>
          )}
          <div className="ew-messages">
            {offline && (
              <div className="ew-offline-note">{t('embed.offline')}</div>
            )}
            {greeting && messages.length === 0 && (
              <div className="ew-msg-row ew-msg-other">
                <div className="ew-msg">
                  {greeting}
                </div>
              </div>
            )}
            {messages.length === 0 && !greeting ? (
              <div className="ew-empty">{t('embed.start')}</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`ew-msg-row ${m.own ? 'ew-msg-own' : 'ew-msg-other'}`}>
                  <div className={`ew-msg ${m.own ? 'ew-msg-own-bubble' : ''}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="ew-composer">
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
              className="ew-input"
            />
            <button
              onClick={() => void send()}
              className="ew-send"
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
        className="ew-fab"
        style={{ backgroundColor: accent }}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
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
