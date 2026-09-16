import { useState } from 'react';
import { useI18n } from '../../lib/i18n';

type Status = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';

interface StatusMeta {
  icon: string;
  labelKey: string;
  label: string;
  meaningKey: string;
  meaning: string;
}

const STATUS_META: Record<Status, StatusMeta> = {
  connected: { icon: '⚡', labelKey: 'transport.direct', label: 'Direct', meaningKey: 'transport.meaningDirect', meaning: 'Connected to a peer over a direct P2P channel (no relay).' },
  connecting: { icon: '⟳', labelKey: 'transport.connecting', label: 'Connecting...', meaningKey: 'transport.meaningConnecting', meaning: 'Establishing the signaling / transport link.' },
  blocked: { icon: '⚠', labelKey: 'transport.degraded', label: 'Degraded', meaningKey: 'transport.meaningDegraded', meaning: 'Connected, but routed through a degraded / restricted path.' },
  disconnected: { icon: '○', labelKey: 'transport.offline', label: 'Offline', meaningKey: 'transport.meaningOffline', meaning: 'Not connected. Waiting to establish a link.' },
  error: { icon: '✕', labelKey: 'transport.error', label: 'Error', meaningKey: 'transport.meaningError', meaning: 'Connection failed — the transport could not be established.' },
};

const RELAY_META: StatusMeta = {
  icon: '🔁',
  labelKey: 'transport.relay',
  label: 'Relay',
  meaningKey: 'transport.meaningRelay',
  meaning: 'Connected, but traffic is routed through a third-party relay server (no direct P2P path).',
};

const STATUS_ORDER: Status[] = ['connected', 'connecting', 'blocked', 'disconnected', 'error'];

export function TransportIndicator({ status = 'disconnected', detail, relayed = false }: { status?: Status; detail?: string | null; relayed?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const isRelayed = relayed && status === 'connected';
  const meta = isRelayed ? RELAY_META : STATUS_META[status] || STATUS_META.disconnected;
  const label = t(meta.labelKey, meta.label);

  return (
    <span
      role="status"
      aria-label={`Connection: ${label}`}
      className="relative inline-flex items-center px-1.5 py-0.5 text-xs rounded-full bg-white/5 cursor-help select-none"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span>{meta.icon}</span>

      {open && (
        <span
          role="tooltip"
          className="absolute top-full right-0 mt-2 z-[var(--z-tooltip)] w-72 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 text-left shadow-xl"
          style={{ whiteSpace: 'normal' }}
        >
          <span className="block text-xs font-semibold text-[var(--text-primary)]">
            {t('transport.current', 'Current:')} {meta.icon} {label}
          </span>
          <span className="mt-1 block text-[11px] leading-snug text-[var(--text-secondary)]">
            {t(meta.meaningKey, meta.meaning)}
          </span>
          {(status === 'blocked' || status === 'error') && detail && (
            <span className="mt-1.5 block text-[11px] font-medium leading-snug text-[var(--danger)] break-words">
              {detail}
            </span>
          )}

          <span className="mt-2.5 block border-t border-[var(--border-color)] pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {t('transport.allStatuses', 'All statuses')}
          </span>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-snug">
            {isRelayed && (
              <li className="flex items-start gap-1.5 text-[var(--text-primary)]">
                <span className="shrink-0">{RELAY_META.icon}</span>
                <span>
                  <span className="font-semibold">{t(RELAY_META.labelKey, RELAY_META.label)}</span>
                  <span className="opacity-85"> — {t(RELAY_META.meaningKey, RELAY_META.meaning)}</span>
                </span>
              </li>
            )}
            {STATUS_ORDER.map((s) => {
              const m = STATUS_META[s];
              const active = s === status;
              return (
                <li key={s} className={`flex items-start gap-1.5 ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  <span className="shrink-0">{m.icon}</span>
                  <span>
                    <span className={active ? 'font-semibold' : 'font-medium'}>{t(m.labelKey, m.label)}</span>
                    <span className="opacity-85"> — {t(m.meaningKey, m.meaning)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </span>
      )}
    </span>
  );
}
