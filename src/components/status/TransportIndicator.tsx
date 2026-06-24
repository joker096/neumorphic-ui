interface TransportIndicatorProps {
  status?: 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';
}

const STATUS_ICONS: Record<string, string> = {
  connected: '⚡',
  blocked: '⚠',
  connecting: '⟳',
  disconnected: '○',
  error: '✕',
};

const STATUS_LABELS: Record<string, string> = {
  connected: 'Direct',
  blocked: 'Degraded',
  connecting: 'Connecting...',
  disconnected: 'Offline',
  error: 'Error',
};

export function TransportIndicator({ status = 'disconnected' }: TransportIndicatorProps) {
  const icon = STATUS_ICONS[status] || '○';
  const label = STATUS_LABELS[status] || 'Unknown';

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-white/5 cursor-help"
      title={`Connection: ${label}`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
