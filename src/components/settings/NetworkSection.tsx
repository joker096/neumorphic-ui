import { SettingsRow, SettingsGroup, ToggleSwitch, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { trafficObfuscator } from '../../lib/transport/obfuscator';
import { toast } from 'sonner';

interface NetworkSectionProps {
  isDark: boolean;
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
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onBack: () => void;
  t: (key: string) => string;
}

const OBFUSCATION_MODES = ['xorshroud', 'httpmask', 'mediadummy'];
const TOR_BRIDGES = ['None', 'obfs4', 'meek', 'Snowflake'];

export const NetworkSection = ({
  isDark, proxyEnabled, setProxyEnabled, proxyUrl, setProxyUrl,
  obfuscationMode, setObfuscationMode, obfuscationEnabled, setObfuscationEnabled,
  torBridge, setTorBridge, turnServerUrl, onUpdateSettings, onBack, t
}: NetworkSectionProps) => {
  const cycleObfuscationMode = () => {
    const idx = OBFUSCATION_MODES.indexOf(obfuscationMode);
    const next = OBFUSCATION_MODES[(idx + 1) % OBFUSCATION_MODES.length];
    setObfuscationMode(next);
    if (obfuscationEnabled) {
      try {
        trafficObfuscator.setMode(next as 'xorshroud' | 'httpmask' | 'mediadummy');
        toast.success(`${t('settings.obfuscation')}: ${next}`);
      } catch {
        console.warn('Failed to set obfuscation mode');
      }
    }
  };

  const cycleTorBridge = () => {
    const idx = TOR_BRIDGES.indexOf(torBridge);
    setTorBridge(TOR_BRIDGES[(idx + 1) % TOR_BRIDGES.length]);
  };

  return (
    <SubView key="network" title={t('settings.network')} isDark={isDark} onBack={onBack}>
      <SettingsGroup isDark={isDark} className="mb-6">
        <SettingsRow
          title={t('settings.useProxy')}
          subtitle={t('settings.proxyUrlSubtitle')}
          isDark={isDark}
          rightElement={
            <div onClick={(e) => { e.stopPropagation(); setProxyEnabled(!proxyEnabled); }} className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${proxyEnabled ? 'bg-emerald-500' : (isDark ? 'bg-gray-600' : 'bg-slate-300')}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm flex-shrink-0 ${proxyEnabled ? 'ml-auto' : 'mr-auto'}`} />
            </div>
          }
          onClick={() => setProxyEnabled(!proxyEnabled)}
        />
        {proxyEnabled && (
          <div className="px-4 py-3 border-b border-black/5 dark:border-white/5">
            <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              {t('settings.proxyUrl')}
            </div>
            <div className={`text-xs mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.proxyUrlSubtitle')}</div>
            <input 
              placeholder={t('settings.proxyUrlExample')}
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors border ${isDark ? "bg-[#11141c] border-white/10 text-white focus:border-blue-500/50" : "bg-[#f4f7f9] border-black/10 text-slate-800 focus:border-blue-500/50"}`}
            />
          </div>
        )}
        <SettingsRow 
          title={t('settings.obfuscation')}
          subtitle={obfuscationEnabled ? 'Active' : 'Disabled'}
          value={obfuscationMode}
          isDark={isDark}
          onClick={cycleObfuscationMode}
        />
        <SettingsRow 
          title={t('settings.torBridge')}
          value={torBridge}
          isDark={isDark}
          onClick={cycleTorBridge}
        />
        <SettingsGroup isDark={isDark} className="mb-6">
          <SettingsRow
            title={t('settings.autoReconnect')}
            subtitle={t('settings.autoReconnectSubtitle')}
            isDark={isDark}
            rightElement={
              <ToggleSwitch isOn={obfuscationEnabled} onToggle={() => setObfuscationEnabled(!obfuscationEnabled)} isDark={isDark} />
            }
            onClick={() => setObfuscationEnabled(!obfuscationEnabled)}
          />
          <SettingsRow
            title={t('settings.p2pMeshMode')}
            subtitle={t('settings.p2pMeshModeSubtitle')}
            isDark={isDark}
            rightElement={
              <ToggleSwitch isOn={true} onToggle={() => setProxyEnabled(!proxyEnabled)} isDark={isDark} />
            }
            onClick={() => setProxyEnabled(!proxyEnabled)}
          />
        </SettingsGroup>
        
        <SettingsSectionTitle title={t('settings.turnServer')} isDark={isDark} />
        <SettingsGroup isDark={isDark} className="mb-6">
          <input 
            placeholder={t('settings.turnServerExample')}
            value={turnServerUrl}
            onChange={(e) => onUpdateSettings({ turnServerUrl: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg text-sm mb-3 focus:outline-none transition-colors border ${isDark ? "bg-[#11141c] border-white/10 text-white focus:border-blue-500/50" : "bg-[#f4f7f9] border-black/10 text-slate-800 focus:border-blue-500/50"}`}
          />
        </SettingsGroup>
      </SettingsGroup>
    </SubView>
  );
};
