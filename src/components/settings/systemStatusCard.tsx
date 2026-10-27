import { Activity, Clock, Zap } from "lucide-react";
import { TransportIndicator } from "../status/TransportIndicator";
import { SettingsCard, SettingsDivider } from "./SettingsMenuPrimitives";
import { ROW_SHELL_CLASS } from '../ui/rowClasses';
import { MUTED_CAPTION_CLASS, PRIMARY_LABEL_CLASS, SECONDARY_TEXT_CLASS } from '../ui/textClasses';

const STATUS_HINT_CLASS = 'text-xs font-medium text-[var(--text-secondary)]';

type T = (key: string, options?: any) => string;

interface SystemStatusCardProps {
  t: T;
  connectionStatus?: 'disconnected' | 'connecting' | 'connected' | 'blocked' | 'error';
  transportBackend?: string;
  latencyMs?: number;
}

export function SystemStatusCard({
  t, connectionStatus = 'disconnected', transportBackend = 'direct', latencyMs = 0,
}: SystemStatusCardProps) {
  const relayed = transportBackend !== 'direct';

  const connectionStatusLabel = (status: string) => {
    switch (status) {
      case 'connected': return t('settings.statusConnected', 'Connected');
      case 'connecting': return t('settings.statusConnecting', 'Connecting');
      case 'blocked': return t('settings.statusBlocked', 'Blocked');
      case 'error': return t('settings.statusError', 'Error');
      default: return t('settings.statusDisconnected', 'Disconnected');
    }
  };

  return (
    <SettingsCard>
      <div className={ROW_SHELL_CLASS}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/10">
            <Activity size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={PRIMARY_LABEL_CLASS}>{t('settings.connectionStatus', 'Connection')}</div>
            <div className={MUTED_CAPTION_CLASS}>{connectionStatusLabel(connectionStatus)}</div>
          </div>
        </div>
        <TransportIndicator status={connectionStatus} relayed={relayed} />
      </div>
      <SettingsDivider />
      <div className={ROW_SHELL_CLASS}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent-soft)]">
            <Zap size={16} className="t-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={SECONDARY_TEXT_CLASS}>{t('settings.transportBackend', 'Transport')}</div>
          </div>
        </div>
        <span className={STATUS_HINT_CLASS}>{transportBackend}</span>
      </div>
      <SettingsDivider />
      <div className={ROW_SHELL_CLASS}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-500/10">
            <Clock size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={SECONDARY_TEXT_CLASS}>{t('settings.latency', 'Latency')}</div>
          </div>
        </div>
        <span className={STATUS_HINT_CLASS}>{`${latencyMs} ms`}</span>
      </div>
    </SettingsCard>
  );
}
