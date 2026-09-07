import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Send, X, MessageSquare } from 'lucide-react';
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

let guestIdentity: X25519KeyPair | null = null;
function getGuest(): X25519KeyPair {
  if (!guestIdentity) guestIdentity = makeGuestIdentity();
  return guestIdentity;
}

type EmbedWidgetProps = {
  token: string;
  theme?: 'light' | 'dark';
};

export const EmbedWidget = ({ token, theme = 'light' }: EmbedWidgetProps) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [offline, setOffline] = useState(false);
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

  const isDark = theme === 'dark';
  const panelBg = isDark ? 'bg-[#1f2430] text-white' : 'bg-white text-slate-900';
  const bubbleBg = 'bg-[var(--accent)] text-[var(--button-primary-text)]';

  return (
    <div className="fixed bottom-4 right-4 z-[var(--z-critical)] flex flex-col items-end font-sans">
      {open && (
        <div className={`w-[320px] max-w-[90vw] h-[440px] max-h-[80vh] rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden ${panelBg}`}>
          <div className={`px-4 py-3 flex items-center justify-between border-b border-[var(--border-color)] ${bubbleBg}`}>
            <span className="font-bold text-sm">{cfgRef.current?.label || t('embed.chat')}</span>
            <button onClick={() => setOpen(false)} aria-label={t('embed.close')} className="cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
            {offline && (
              <div className="text-[11px] text-amber-500 text-center">{t('embed.offline')}</div>
            )}
            {messages.length === 0 ? (
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
            <button onClick={() => void send()} className={`min-w-11 min-h-11 rounded-xl flex items-center justify-center cursor-pointer ${bubbleBg}`}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('embed.openChat')}
        className={`mt-3 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer ${bubbleBg}`}
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
