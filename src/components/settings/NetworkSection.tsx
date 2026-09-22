import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import type { TunnelBackend } from '../../lib/transport/wsTunnel';
import { IS_RELAY_PROXY_CONFIGURED } from '../../config/signalling';
import { RefreshCw, Radio } from 'lucide-react';

interface NetworkSectionProps {
  isDark?: boolean;
  obfuscationEnabled: boolean;
  setObfuscationEnabled: (v: boolean) => void;
  turnServerUrl: string;
  turnServerUser?: string;
  turnServerPass?: string;
  relayBackend: string;
  setRelayBackend: (v: string) => void;
  autoReconnectEnabled: boolean;
  setAutoReconnectEnabled: (v: boolean) => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onBack: () => void;
  t: (key: string, fallback?: string) => string;
}

const RELAY_BACKENDS: TunnelBackend[] = ['direct', 'cfworker', 'domainfront', 'peertunnel'];

export const NetworkSection = ({
  isDark = false,
  obfuscationEnabled, setObfuscationEnabled,
  turnServerUrl, turnServerUser, turnServerPass, onUpdateSettings, onBack, t,
  relayBackend, setRelayBackend, autoReconnectEnabled, setAutoReconnectEnabled,
}: NetworkSectionProps) => {
  const cycleRelayBackend = () => {
    const idx = RELAY_BACKENDS.indexOf(relayBackend as TunnelBackend);
    const next = RELAY_BACKENDS[(idx + 1) % RELAY_BACKENDS.length];
    setRelayBackend(next);
  };

  return (
    <SubView key="network" title={t('settings.network')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.relaySection')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsToggleRow
          title={t('settings.obfuscation')}
          subtitle={obfuscationEnabled ? t('settings.obfuscationActive') : t('settings.obfuscationDisabled')}
          isOn={obfuscationEnabled}
          onToggle={() => setObfuscationEnabled(!obfuscationEnabled)}
          isDark={isDark}
        />
        {IS_RELAY_PROXY_CONFIGURED && (
          <SettingsRow
            title={t('settings.relayBackend')}
            subtitle={relayBackend}
            value={relayBackend}
            icon={<Radio size={16} />}
            iconBg="t-accent-bg"
            iconColor="t-accent"
            isDark={isDark}
            onClick={cycleRelayBackend}
          />
        )}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.transportOptions')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsToggleRow
          title={t('settings.autoReconnect')}
          subtitle={t('settings.autoReconnectSubtitle')}
          isOn={autoReconnectEnabled}
          onToggle={() => setAutoReconnectEnabled(!autoReconnectEnabled)}
          isDark={isDark}
          toggleOnIcon={<RefreshCw size={14} />}
          toggleOffIcon={<RefreshCw size={14} />}
        />
      </SettingsGroup>
      
      <SettingsSectionTitle title={t('settings.turnServer')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <input 
          placeholder={t('settings.turnServerExample')}
          value={turnServerUrl}
          onChange={(e) => onUpdateSettings({ turnServerUrl: e.target.value })}
          className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors ${isDark ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-slate-800"}`}
        />
        <div className="mt-4 flex flex-col gap-3">
          <label className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            {t('settings.turnServerUserLabel', 'TURN username')}
          </label>
          <input
            aria-label={t('settings.turnServerUserLabel', 'TURN username')}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={turnServerUser || ''}
            onChange={(e) => onUpdateSettings({ turnServerUser: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors ${isDark ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-slate-800"}`}
          />
          <label className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            {t('settings.turnServerPassLabel', 'TURN password')}
          </label>
          <input
            aria-label={t('settings.turnServerPassLabel', 'TURN password')}
            type="password"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            value={turnServerPass || ''}
            onChange={(e) => onUpdateSettings({ turnServerPass: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors ${isDark ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-slate-800"}`}
          />
        </div>
      </SettingsGroup>
    </SubView>
  );
};



