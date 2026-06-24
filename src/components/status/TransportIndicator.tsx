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

export function TransportIndicator() {
  const connectionStatus = 'disconnected';
  const icon = STATUS_ICONS[connectionStatus] || '○';
  const label = STATUS_LABELS[connectionStatus] || 'Unknown';

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
