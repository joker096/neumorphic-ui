import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionSettings } from './ConnectionSettings';

const t = (key: string) => {
  const translations: Record<string, string> = {
    'settings.connection': 'Connection',
    'settings.transportMode': 'Transport Mode',
    'settings.transportModeXorShroud': 'XOR Shroud (basic)',
    'settings.transportModeHttpMask': 'HTTP Mask (recommended)',
    'settings.transportModeMediaDummy': 'Media Dummy (stealth)',
    'settings.relayPreference': 'Relay Preference',
    'settings.relayAuto': 'Auto',
    'settings.relayDirect': 'Direct',
    'settings.relayCloudflare': 'Cloudflare Worker',
    'settings.relayDomainFront': 'Domain Fronting',
    'settings.relayPeerTunnel': 'Peer Relay',
    'settings.status': 'Status',
    'settings.disconnected': 'disconnected',
    'settings.backend': 'Backend',
    'settings.latency': 'Latency',
    'settings.resetTransportCache': 'Reset Transport Cache',
  };
  return translations[key] || key;
};

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: () => ({
    connectionStatus: 'disconnected',
    transportBackend: 'direct',
    latencyMs: 0,
    blockedBackends: [],
    regionBlocked: false,
  }),
}));

describe('ConnectionSettings', () => {
  it('should render transport mode selector', () => {
    render(<ConnectionSettings t={t} onBack={vi.fn()} />);
    expect(screen.getByText('Transport Mode')).toBeDefined();
  });
});
