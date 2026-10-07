import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { ChannelList } from './ChannelList';
import { Send, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { RelayClient } from '../../lib/company/relayClient';
import type { RelayStatus } from '../../lib/company/relaySocket';
import { openFromChannel, sealToChannel, type SealedMessage } from '../../lib/embed/embedCrypto';
import { b64decode } from '../../lib/crypto/cryptoCore';
import type { X25519KeyPair } from '../../lib/crypto/types';
import { formatClockTime } from '../../utils/chatUtils';

type TeamInboxProps = {
  isDark?: boolean;
};

const uid = () =>
  `cm_${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

/** Extract a normalized domain from a page URL, e.g. 'https://Shop.Example.com/x' → 'shop.example.com'. */
function domainFromPageUrl(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split('?')[0];
  }
}

/** Shape of the typed contact envelope sealed by the widget (see EmbedWidget). */
interface ContactEnvelope {
  v: 1;
  kind: 'contact';
  name?: string;
  email?: string;
  phone?: string;
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  ts?: number;
}

export const TeamInbox = ({ isDark = false }: TeamInboxProps) => {
  const { t, lang } = useI18n();
  const companyChannels = useAppStore((s) => s.companyChannels);
  const activeChannelId = useAppStore((s) => s.activeChannelId);
  const setActiveChannel = useAppStore((s) => s.setActiveChannel);
  const companyMessages = useAppStore((s) => s.companyMessages);
  const addCompanyMessage = useAppStore((s) => s.addCompanyMessage);
  const userProfile = useAppStore((s) => s.userProfile);
  const syncCrmOutbound = useAppStore((s) => s.syncCrmOutbound);
  const companyId = useAppStore((s) => s.companyId);
  const siteChats = useAppStore((s) => s.siteChats);
  const channelKeys = useAppStore((s) => s.channelKeys);
  const ingestWebsiteContact = useAppStore((s) => s.ingestWebsiteContact);
  const [draft, setDraft] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [relayStatus, setRelayStatus] = useState<RelayStatus>('connecting');

  const active = companyChannels.find((c) => c.id === activeChannelId) || companyChannels[0] || null;
  const isSite = !!active && siteChats.some((s) => s.id === active.id);
  const relayRef = useRef<RelayClient | null>(null);
  const lastGuestPub = useRef<string | null>(null);

  useEffect(() => {
    if (!isSite || !companyId || !active) return;
    const client = new RelayClient(`company:${companyId}:channel:${active.id}`);
    client.onMessage(async (payload: any) => {
      try {
        const sealed = payload as SealedMessage;
        lastGuestPub.current = sealed.senderPubKey;
        const secret = channelKeys[active.id]?.secretKeyB64;
        if (!secret) return;
        const text = await openFromChannel(secret, sealed);
        // Typed contact envelope (sealed JSON from the widget's pre-chat form) —
        // import to CRM + website-contacts list, never renders as a bubble.
        try {
          const parsed = JSON.parse(text) as Partial<ContactEnvelope>;
          if (parsed?.v === 1 && parsed.kind === 'contact') {
            const domain = domainFromPageUrl(parsed.pageUrl);
            const rec = ingestWebsiteContact({
              siteChatId: active.id,
              domain: domain || parsed.pageTitle || 'unknown',
              name: parsed.name || '',
              email: parsed.email,
              phone: parsed.phone,
              pageUrl: parsed.pageUrl,
              pageTitle: parsed.pageTitle,
              referrer: parsed.referrer,
              ts: parsed.ts,
            });
            if (rec && rec.name && rec.name !== 'Website visitor') {
              toast.success(`${t('company.websiteContactImported')}: ${rec.name}`);
            }
            return;
          }
        } catch {
          /* not an envelope — treat as plain chat message */
        }
        addCompanyMessage({
          id: uid(),
          channelId: active.id,
          senderId: 'guest',
          senderName: 'Site visitor',
          text,
          timestamp: Date.now(),
          status: 'read',
        });
      } catch {
        /* corrupt envelope — ignore */
      }
    });
    client.onStatus(setRelayStatus);
    client.start();
    relayRef.current = client;
    return () => {
      client.stop();
      relayRef.current = null;
    };
  }, [isSite, companyId, active?.id, channelKeys]);

  const thread = active
    ? companyMessages
        .filter((m) => m.channelId === active.id)
        .sort((a, b) => a.timestamp - b.timestamp)
    : [];
  // Non-site channels are plain team channels — nothing to connect to.
  const relayOnline = !isSite || relayStatus === 'online';

  const send = async () => {
    const text = draft.trim();
    if (!text || !active) return;
    // A site reply that the relay would drop is not a reply — refuse it instead
    // of showing the agent a locally-"sent" bubble the visitor never receives.
    if (isSite && !relayOnline) {
      toast.error(t('company.siteChatOffline', 'Website embed is offline — replies will not reach visitors'));
      return;
    }
    addCompanyMessage({
      id: uid(),
      channelId: active.id,
      senderId: userProfile.id,
      senderName: userProfile.name || 'You',
      text,
      timestamp: Date.now(),
      status: 'sent',
    });
    if (isSite && lastGuestPub.current) {
      const ck = channelKeys[active.id];
      if (ck) {
        const channelKp: X25519KeyPair = {
          publicKey: b64decode(ck.publicKeyB64),
          secretKey: b64decode(ck.secretKeyB64),
        };
        try {
          const sealed = await sealToChannel(channelKp, lastGuestPub.current, text);
          relayRef.current?.publish(sealed);
        } catch {
          /* encryption failed — message kept locally */
        }
      }
    }
    setDraft('');
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncCrmOutbound();
      if (res.ok) toast.success(t('company.crmSynced', 'CRM snapshot encrypted & shared with team'));
      else toast.error(t('company.crmSyncNoKey', 'No group key — create or join a company first'));
    } finally {
      setSyncing(false);
    }
  };

  if (!active) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] py-10">
        <MessageSquare size={32} />
        <div className="text-sm">{t('company.noChannels', 'No team channels yet')}</div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row gap-3 min-h-0">
      <div className="md:w-64 shrink-0">
        <ChannelList
          isDark={isDark}
          channels={companyChannels}
          channelsLabel={t('company.channels', 'Channels')}
          onChannelClick={(c) => setActiveChannel(c.id)}
          t={t}
        />
        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-3 w-full min-h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {t('company.syncCrm', 'Sync CRM → team')}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-[var(--bg-tertiary)]">
        <div className="px-4 py-3 border-b border-[var(--border-color)] font-bold text-sm">
          {active.name}
          {active.description ? (
            <div className="text-xs font-normal text-[var(--text-secondary)]">{active.description}</div>
          ) : null}
          {isSite && (
            <div
              className={`text-[11px] font-normal mt-0.5 ${relayOnline ? 'text-emerald-500' : 'text-amber-500'}`}
            >
              {relayOnline
                ? t('company.siteChatLive', 'Website embed · E2E encrypted')
                : t('company.siteChatOffline', 'Website embed is offline — replies will not reach visitors')}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {thread.length === 0 ? (
            <div className="text-center text-xs text-[var(--text-secondary)] py-6">
              {t('company.noMessages', 'No messages yet — start the conversation')}
            </div>
          ) : (
            thread.map((m) => {
              const own = m.senderId === userProfile.id;
              return (
                <div key={m.id} className={`flex flex-col max-w-[80%] ${own ? 'self-end items-end' : 'self-start items-start'}`}>
                  {!own && <div className="text-[11px] text-[var(--text-secondary)] mb-0.5">{m.senderName}</div>}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm ${
                      own
                        ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]'
                        : 'bg-[var(--list-item-hover-bg)] text-[var(--text-primary)]'
                    }`}
                  >
                    {m.text}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {formatClockTime(m.timestamp, lang)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-[var(--border-color)] flex items-center gap-2">
          <input
            aria-label={t('company.typeMessage', 'Type a message…')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t('company.typeMessage', 'Type a message…')}
            className="flex-1 min-h-11 rounded-xl px-3 bg-[var(--input-bg)] text-[var(--text-primary)] outline-none"
          />
          <button
            onClick={() => void send()}
            className="min-w-11 min-h-11 rounded-xl flex items-center justify-center bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
