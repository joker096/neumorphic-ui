import { useState } from 'react';

type Status = 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';

interface StatusMeta {
  icon: string;
  label: string;
  meaning: string;
}

const STATUS_META: Record<Status, StatusMeta> = {
  connected: { icon: '⚡', label: 'Direct', meaning: 'Connected to a peer over a direct P2P channel (no relay).' },
  connecting: { icon: '⟳', label: 'Connecting...', meaning: 'Establishing the signaling / transport link.' },
  blocked: { icon: '⚠', label: 'Degraded', meaning: 'Connected, but routed through a degraded / restricted path.' },
  disconnected: { icon: '○', label: 'Offline', meaning: 'Not connected. Waiting to establish a link.' },
  error: { icon: '✕', label: 'Error', meaning: 'Connection failed — the transport could not be established.' },
};

const STATUS_ORDER: Status[] = ['connected', 'connecting', 'blocked', 'disconnected', 'error'];

export function TransportIndicator({ status = 'disconnected' }: { status?: Status }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[status] || STATUS_META.disconnected;

  return (
    <span
      role="status"
      aria-label={`Connection: ${meta.label}`}
      className="relative inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/5 cursor-help select-none"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span>{meta.icon}</span>
      <span className="hidden sm:inline">{meta.label}</span>

      {open && (
        <span
          role="tooltip"
          className="absolute top-full right-0 mt-2 z-[100] w-72 rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 text-left shadow-xl"
          style={{ whiteSpace: 'normal' }}
        >
          <span className="block text-xs font-semibold text-[var(--text-primary)]">
            Current: {meta.icon} {meta.label}
          </span>
          <span className="mt-1 block text-[11px] leading-snug text-[var(--text-secondary)]">
            {meta.meaning}
          </span>

          <span className="mt-2.5 block border-t border-[var(--border-color)] pt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            All statuses
          </span>
          <ul className="mt-1.5 space-y-1 text-[11px] leading-snug">
            {STATUS_ORDER.map((s) => {
              const m = STATUS_META[s];
              const active = s === status;
              return (
                <li key={s} className={`flex items-start gap-1.5 ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                  <span className="shrink-0">{m.icon}</span>
                  <span>
                    <span className={active ? 'font-semibold' : 'font-medium'}>{m.label}</span>
                    <span className="opacity-85"> — {m.meaning}</span>
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
