import { useState } from 'react';

const TRANSPORT_MODES = [
  { value: 'xorshroud', label: 'XOR Shroud (basic)' },
  { value: 'httpmask', label: 'HTTP Mask (recommended)' },
  { value: 'mediadummy', label: 'Media Dummy (stealth)' },
];

const RELAY_PREFERENCES = [
  { value: 'auto', label: 'Auto' },
  { value: 'direct', label: 'Direct' },
  { value: 'cfworker', label: 'Cloudflare Worker' },
  { value: 'domainfront', label: 'Domain Fronting' },
  { value: 'peertunnel', label: 'Peer Relay' },
];

export function ConnectionSettings() {
  const [transportMode, setTransportMode] = useState('httpmask');
  const [relayPref, setRelayPref] = useState('auto');

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-lg font-bold">Connection</h2>

      <div>
        <label className="text-sm font-medium">Transport Mode</label>
        <select
          value={transportMode}
          onChange={(e) => setTransportMode(e.target.value)}
          className="w-full mt-1 p-2 rounded-lg bg-white/5 border border-white/10"
        >
          {TRANSPORT_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Relay Preference</label>
        <select
          value={relayPref}
          onChange={(e) => setRelayPref(e.target.value)}
          className="w-full mt-1 p-2 rounded-lg bg-white/5 border border-white/10"
        >
          {RELAY_PREFERENCES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <p className="text-sm">Status: <span className="font-mono">disconnected</span></p>
        <p className="text-sm">Backend: <span className="font-mono">direct</span></p>
        <p className="text-sm">Latency: <span className="font-mono">0ms</span></p>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem('mess_blocked_backends');
          window.location.reload();
        }}
        className="w-full p-2 rounded-lg bg-orange-600 text-white text-sm font-medium"
      >
        Reset Transport Cache
      </button>
    </div>
  );
}
