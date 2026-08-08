import { Activity, Wifi, Zap, Clock, Smartphone } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { APP_INFO } from '../../config/settingsDefaults';

interface SystemStatusSectionProps {
  isDark?: boolean;
  connectionStatus: string;
  transportBackend: string;
  latencyMs: number;
  blockedBackends: string[];
  regionBlocked: boolean;
  onBack: () => void;
  t: (key: string) => string;
  isOnline?: boolean;
  pendingMessages?: number;
}

const statusColors: Record<string, string> = {
  connected: 'text-emerald-400',
  connecting: 'text-amber-400',
  disconnected: 'text-gray-400',
  blocked: 'text-red-400',
  error: 'text-red-400',
};

const statusIcons: Record<string, string> = {
  connected: '●',
  connecting: '◐',
  disconnected: '○',
  blocked: '✕',
  error: '⚠',
};

export const SystemStatusSection = ({
  isDark = false, connectionStatus, transportBackend, latencyMs, blockedBackends, regionBlocked, onBack, t
}: SystemStatusSectionProps) => (
  <SubView title={t('settings.systemStatus')} isDark={isDark} onBack={onBack}>
    <SettingsSectionTitle title={t('settings.connection')} isDark={isDark} />
    <SettingsGroup isDark={isDark} className="mb-6">
      <SettingsRow
        icon={<Wifi size={16} />}
        iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
        iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
        title={t('settings.connectionStatus')}
        subtitle={connectionStatus}
        isDark={isDark}
        rightElement={
          <span className={`text-lg ${statusColors[connectionStatus] || 'text-gray-400'}`}>
            {statusIcons[connectionStatus] || '○'}
          </span>
        }
      />
      <SettingsRow
        icon={<Zap size={16} />}
        iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
        iconColor={isDark ? "text-blue-400" : "text-blue-600"}
        title={t('settings.transportBackend')}
        subtitle={transportBackend}
        isDark={isDark}
      />
      <SettingsRow
        icon={<Clock size={16} />}
        iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
        iconColor={isDark ? "text-amber-400" : "text-amber-600"}
        title={t('settings.latency')}
        subtitle={`${latencyMs} ms`}
        isDark={isDark}
      />
    </SettingsGroup>

    {blockedBackends.length > 0 && (
      <>
        <SettingsSectionTitle title={t('settings.blockedBackends')} isDark={isDark} />
        <SettingsGroup isDark={isDark} className="mb-6">
          {blockedBackends.map(backend => (
            <SettingsRow
              key={backend}
              icon={<span className="text-red-400 font-bold">✕</span>}
              title={backend}
              isDark={isDark}
            />
          ))}
        </SettingsGroup>
      </>
    )}

    {regionBlocked && (
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          icon={<span className="text-red-400 font-bold">⚠</span>}
          title={t('settings.regionBlocked')}
          subtitle={t('settings.regionBlockedSubtitle')}
          isDark={isDark}
        />
      </SettingsGroup>
    )}

    <SettingsSectionTitle title={t('settings.about')} isDark={isDark} />
    <SettingsGroup isDark={isDark}>
      <SettingsRow
       icon={<Smartphone size={16} />}
          title={t('settings.about')}
          subtitle={`Build: ${APP_INFO.BUILD_DATE}`}
        isDark={isDark}
      />
    </SettingsGroup>
  </SubView>
);
