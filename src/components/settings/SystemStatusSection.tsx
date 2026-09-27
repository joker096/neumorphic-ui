import { useState } from 'react';
import { Wifi, Zap, Clock, Smartphone } from 'lucide-react';
import { SettingsRow, SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { Modal } from '../ui/Modal';
import { APP_INFO } from '../../config/settingsDefaults';

interface SystemStatusSectionProps {
  isDark?: boolean;
  connectionStatus: string;
  transportBackend: string;
  latencyMs: number;
  blockedBackends: string[];
  regionBlocked: boolean;
  onBack: () => void;
  t: (key: string, fallback?: string) => string;
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
}: SystemStatusSectionProps) => {
  const [showAbout, setShowAbout] = useState(false);

  const connectionStatusLabel =
    connectionStatus === 'connected'
      ? t('settings.statusConnected', 'Connected')
      : connectionStatus === 'connecting'
        ? t('settings.statusConnecting', 'Connecting...')
        : connectionStatus === 'blocked'
          ? t('settings.statusBlocked', 'Blocked')
          : connectionStatus === 'error'
            ? t('settings.statusError', 'Error')
            : t('settings.statusDisconnected', 'Disconnected');

  return (
    <>
      <SubView title={t('settings.systemStatus')} isDark={isDark} onBack={onBack}>
        <SettingsSectionTitle title={t('settings.connection')} isDark={isDark} />
        <SettingsGroup isDark={isDark} className="mb-6">
          <SettingsRow
            icon={<Wifi size={16} />}
            iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
            iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
            title={t('settings.connectionStatus')}
            subtitle={connectionStatusLabel}
            isDark={isDark}
            rightElement={
              <span className={`text-lg ${statusColors[connectionStatus] || 'text-gray-400'}`}>
                {statusIcons[connectionStatus] || '○'}
              </span>
            }
          />
          <SettingsRow
            icon={<Zap size={16} />}
            iconBg="bg-[var(--accent-soft)]"
            iconColor="text-[var(--accent)]"
            title={t('settings.transportBackend')}
            rightElement={<span className="text-xs font-medium text-muted-foreground">{transportBackend}</span>}
            isDark={isDark}
          />
          <SettingsRow
            icon={<Clock size={16} />}
            iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
            iconColor={isDark ? "text-amber-400" : "text-amber-600"}
            title={t('settings.latency')}
            rightElement={<span className="text-xs font-medium text-muted-foreground">{`${latencyMs} ms`}</span>}
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
            subtitle={`${t('settings.build', 'Build')}: ${APP_INFO.BUILD_DATE}`}
            isDark={isDark}
            onClick={() => setShowAbout(true)}
          />
        </SettingsGroup>
      </SubView>

      <Modal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        title={APP_INFO.NAME}
        subtitle={t('settings.aboutSubtitle')}
        icon={<Smartphone size={24} />}
        isDark={isDark}
        size="sm"
        closeLabel={t('common.close')}
        ariaLabel={t('settings.about')}
      >
        <div className="rounded-xl overflow-hidden border border-border bg-[var(--bg-tertiary)]">
          <div className="flex justify-between items-center px-4 py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">{t('settings.version')}</span>
            <span className="text-sm font-medium text-foreground">{APP_INFO.VERSION}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-muted-foreground">{t('settings.build')}</span>
            <span className="text-sm font-medium text-foreground">{APP_INFO.BUILD_DATE}</span>
          </div>
        </div>
      </Modal>
    </>
  );
};
