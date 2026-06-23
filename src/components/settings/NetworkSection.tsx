import { SettingsRow, SettingsGroup, ToggleSwitch } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';

interface NetworkSectionProps {
  isDark: boolean;
  proxyEnabled: boolean;
  setProxyEnabled: (v: boolean) => void;
  proxyUrl: string;
  setProxyUrl: (v: string) => void;
  obfuscationMode: string;
  setObfuscationMode: (v: string) => void;
  torBridge: string;
  setTorBridge: (v: string) => void;
  turnServerUrl: string;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
  onBack: () => void;
  t: (key: string) => string;
}

export const NetworkSection = ({
  isDark, proxyEnabled, setProxyEnabled, proxyUrl, setProxyUrl,
  obfuscationMode, setObfuscationMode, torBridge, setTorBridge,
  turnServerUrl, onUpdateSettings, onBack, t
}: NetworkSectionProps) => (
  <SubView key="network" title="Network" isDark={isDark} onBack={onBack}>
    <SettingsGroup isDark={isDark} className="mb-6">
      <SettingsRow
        title={t('settings.useProxy')}
        subtitle="SOCKS5 / HTTP"
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
            placeholder="socks5://127.0.0.1:9050"
            value={proxyUrl}
            onChange={(e) => setProxyUrl(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors border ${isDark ? "bg-[#11141c] border-white/10 text-white focus:border-blue-500/50" : "bg-[#f4f7f9] border-black/10 text-slate-800 focus:border-blue-500/50"}`}
          />
        </div>
      )}
      <SettingsRow 
        title={t('settings.obfuscation')}
        value={obfuscationMode}
        isDark={isDark}
        onClick={() => setObfuscationMode(obfuscationMode === "Auto" ? "MTProto" : obfuscationMode === "MTProto" ? "Domain Fronting" : "Auto")}
      />
      <SettingsRow 
        title={t('settings.torBridge')}
        value={torBridge}
        isDark={isDark}
        onClick={() => setTorBridge(torBridge === "None" ? "obfs4" : torBridge === "obfs4" ? "meek" : torBridge === "meek" ? "Snowflake" : "None")}
      />
      
      <div className="px-4 py-3 mt-4 border-t border-black/5 dark:border-white/5">
        <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
          {t('settings.turnServer')}
        </div>
        <input 
          placeholder="turn:server.url:3478"
          value={turnServerUrl}
          onChange={(e) => onUpdateSettings({ turnServerUrl: e.target.value })}
          className={`w-full px-3 py-2 rounded-lg text-sm mb-3 focus:outline-none transition-colors border ${isDark ? "bg-[#11141c] border-white/10 text-white focus:border-blue-500/50" : "bg-[#f4f7f9] border-black/10 text-slate-800 focus:border-blue-500/50"}`}
        />
      </div>
    </SettingsGroup>
  </SubView>
);