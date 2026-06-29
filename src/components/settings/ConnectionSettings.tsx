import { useState } from 'react';

const TRANSPORT_MODES = [
  { value: 'xorshroud', key: 'settings.transportModeXorShroud' },
  { value: 'httpmask', key: 'settings.transportModeHttpMask' },
  { value: 'mediadummy', key: 'settings.transportModeMediaDummy' },
];

const RELAY_PREFERENCES = [
  { value: 'auto', key: 'settings.relayAuto' },
  { value: 'direct', key: 'settings.relayDirect' },
  { value: 'cfworker', key: 'settings.relayCloudflare' },
  { value: 'domainfront', key: 'settings.relayDomainFront' },
  { value: 'peertunnel', key: 'settings.relayPeerTunnel' },
];

interface ConnectionSettingsProps {
  t: (key: string) => string;
}

export function ConnectionSettings({ t }: ConnectionSettingsProps) {
  const [transportMode, setTransportMode] = useState('httpmask');
  const [relayPref, setRelayPref] = useState('auto');

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-bold tracking-tight">{t('settings.connection')}</h2>

      <div>
        <label className="text-sm font-semibold">{t('settings.transportMode')}</label>
        <select
          value={transportMode}
          onChange={(e) => setTransportMode(e.target.value)}
          className="w-full mt-1 p-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium"
        >
          {TRANSPORT_MODES.map((m) => (
            <option key={m.value} value={m.value}>{t(m.key)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold">{t('settings.relayPreference')}</label>
        <select
          value={relayPref}
          onChange={(e) => setRelayPref(e.target.value)}
          className="w-full mt-1 p-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium"
        >
          {RELAY_PREFERENCES.map((r) => (
            <option key={r.value} value={r.value}>{t(r.key)}</option>
          ))}
        </select>
      </div>

      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm font-medium">{t('settings.status')}: <span className="font-mono">{t('settings.disconnected')}</span></p>
        <p className="text-sm font-medium">{t('settings.backend')}: <span className="font-mono">direct</span></p>
        <p className="text-sm font-medium">{t('settings.latency')}: <span className="font-mono">0ms</span></p>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('mess_blocked_backends');
          window.location.reload();
        }}
        className="w-full p-2 rounded-lg bg-orange-600 text-white text-sm font-semibold"
      >
        {t('settings.resetTransportCache')}
      </button>
    </div>
  );
}
