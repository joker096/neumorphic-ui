import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { trafficObfuscator } from '../../lib/transport/obfuscator';
import type { TunnelBackend } from '../../lib/transport/wsTunnel';
import { Globe, RefreshCw, Network, Radio } from 'lucide-react';

interface NetworkSectionProps {
  isDark?: boolean;
  proxyEnabled: boolean;
  setProxyEnabled: (v: boolean) => void;
  proxyUrl: string;
  setProxyUrl: (v: string) => void;
  obfuscationMode: string;
  setObfuscationMode: (v: string) => void;
  obfuscationEnabled: boolean;
  setObfuscationEnabled: (v: boolean) => void;
  torBridge: string;
  setTorBridge: (v: string) => void;
  turnServerUrl: string;
  turnServerUser?: string;
  turnServerPass?: string;
  relayBackend: string;
  setRelayBackend: (v: string) => void;
  autoReconnectEnabled: boolean;
  setAutoReconnectEnabled: (v: boolean) => void;
  p2pMeshEnabled: boolean;
  setP2pMeshEnabled: (v: boolean) => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onBack: () => void;
  t: (key: string) => string;
}

const OBFUSCATION_MODES = ['xorshroud', 'httpmask', 'mediadummy'];
const TOR_BRIDGES = ['None', 'obfs4', 'meek', 'Snowflake'];
const RELAY_BACKENDS: TunnelBackend[] = ['direct', 'cfworker', 'domainfront', 'peertunnel'];

export const NetworkSection = ({
  isDark = false, proxyEnabled, setProxyEnabled, proxyUrl, setProxyUrl,
  obfuscationMode, setObfuscationMode, obfuscationEnabled, setObfuscationEnabled,
  torBridge, setTorBridge, turnServerUrl, onUpdateSettings, onBack, t,
  relayBackend, setRelayBackend, autoReconnectEnabled, setAutoReconnectEnabled,
  p2pMeshEnabled, setP2pMeshEnabled,
}: NetworkSectionProps) => {
  const cycleObfuscationMode = () => {
    const idx = OBFUSCATION_MODES.indexOf(obfuscationMode);
    const next = OBFUSCATION_MODES[(idx + 1) % OBFUSCATION_MODES.length];
    setObfuscationMode(next);
    trafficObfuscator.setMode(next as 'xorshroud' | 'httpmask' | 'mediadummy');
  };

  const cycleTorBridge = () => {
    const idx = TOR_BRIDGES.indexOf(torBridge);
    setTorBridge(TOR_BRIDGES[(idx + 1) % TOR_BRIDGES.length]);
  };

  const cycleRelayBackend = () => {
    const idx = RELAY_BACKENDS.indexOf(relayBackend as TunnelBackend);
    const next = RELAY_BACKENDS[(idx + 1) % RELAY_BACKENDS.length];
    setRelayBackend(next);
  };

  return (
    <SubView key="network" title={t('settings.network')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.proxySection')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsToggleRow
          title={t('settings.useProxy')}
          subtitle={t('settings.proxyUrlSubtitle')}
          isOn={proxyEnabled}
          onToggle={() => setProxyEnabled(!proxyEnabled)}
          isDark={isDark}
          toggleOnIcon={<Globe size={14} />}
          toggleOffIcon={<Globe size={14} />}
        />
        {proxyEnabled && (
          <div className="px-4 py-3">
            <div className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.proxyUrlSubtitle')}</div>
            <input 
              placeholder={t('settings.proxyUrlExample')}
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-500/50" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800 focus:border-blue-500/50"}`}
            />
          </div>
        )}
        <SettingsToggleRow
          title={t('settings.obfuscation')}
          subtitle={obfuscationEnabled ? t('settings.obfuscationActive') : t('settings.obfuscationDisabled')}
          isOn={obfuscationEnabled}
          onToggle={() => setObfuscationEnabled(!obfuscationEnabled)}
          isDark={isDark}
        />
        {obfuscationEnabled && (
          <SettingsRow 
            title={t('settings.obfuscationMode')}
            value={obfuscationMode}
            isDark={isDark}
            onClick={cycleObfuscationMode}
          />
        )}
      </SettingsGroup>

      <SettingsSectionTitle title={t('settings.relaySection')} isDark={isDark} />
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          title={t('settings.relayBackend')}
          subtitle={relayBackend}
          value={relayBackend}
          icon={<Radio size={16} />}
          iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
          iconColor={isDark ? "text-blue-400" : "text-blue-600"}
          isDark={isDark}
          onClick={cycleRelayBackend}
        />
        <SettingsRow 
          title={t('settings.torBridge')}
          value={torBridge}
          isDark={isDark}
          onClick={cycleTorBridge}
        />
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
        <SettingsToggleRow
          title={t('settings.p2pMeshMode')}
          subtitle={t('settings.p2pMeshModeSubtitle')}
          isOn={p2pMeshEnabled}
          onToggle={() => setP2pMeshEnabled(!p2pMeshEnabled)}
          isDark={isDark}
          toggleOnIcon={<Network size={14} />}
          toggleOffIcon={<Network size={14} />}
        />
      </SettingsGroup>
      
      <SettingsSectionTitle title={t('settings.turnServer')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <input 
          placeholder={t('settings.turnServerExample')}
          value={turnServerUrl}
          onChange={(e) => onUpdateSettings({ turnServerUrl: e.target.value })}
          className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors border ${isDark ? "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-500/50" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-slate-800 focus:border-blue-500/50"}`}
        />
      </SettingsGroup>
    </SubView>
  );
};



