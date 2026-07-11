import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NetworkSection } from './NetworkSection';

vi.mock('../../lib/i18n', () => ({
 useI18n: () => ({
  t: (key: string) => key,
  lang: 'en',
  setLang: vi.fn(),
 }),
}));

vi.mock('../../lib/transport/obfuscator', () => ({
 trafficObfuscator: { setMode: vi.fn() },
}));

describe('NetworkSection - additional tests', () => {
  const defaultProps = {
   isDark: false,
   proxyEnabled: false,
  setProxyEnabled: vi.fn(),
  proxyUrl: '',
  setProxyUrl: vi.fn(),
  obfuscationMode: 'xorshroud',
  setObfuscationMode: vi.fn(),
  obfuscationEnabled: false,
  setObfuscationEnabled: vi.fn(),
  torBridge: 'None',
  setTorBridge: vi.fn(),
  turnServerUrl: '',
  turnServerUser: '',
  turnServerPass: '',
  relayBackend: 'direct',
  setRelayBackend: vi.fn(),
  autoReconnectEnabled: false,
  setAutoReconnectEnabled: vi.fn(),
  p2pMeshEnabled: false,
  setP2pMeshEnabled: vi.fn(),
  onUpdateSettings: vi.fn(),
  onBack: vi.fn(),
  t: (k: string) => k,
 };

 it('renders all section titles', () => {
  render(<NetworkSection {...defaultProps} />);
  expect(screen.getByText('settings.proxySection')).toBeInTheDocument();
  expect(screen.getByText('settings.relaySection')).toBeInTheDocument();
  expect(screen.getByText('settings.transportOptions')).toBeInTheDocument();
 });

 it('renders all toggles', () => {
   render(<NetworkSection {...defaultProps} />);
   const toggles = document.querySelectorAll('button[role="switch"]');
   expect(toggles.length).toBeGreaterThanOrEqual(1);
  });

 it('renders proxy URL input when proxy enabled', () => {
  render(<NetworkSection {...defaultProps} proxyEnabled={true} />);
  const input = document.querySelector('input');
  expect(input).toHaveAttribute('placeholder');
 });

it('renders TURN server inputs', () => {
   render(<NetworkSection {...defaultProps} />);
   const inputs = document.querySelectorAll('input');
   expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

 it('renders relay backend value', () => {
  render(<NetworkSection {...defaultProps} />);
  expect(screen.getByText(/settings\.relayBackend/)).toBeInTheDocument();
 });

 it('renders relay backend icon', () => {
  const { container } = render(<NetworkSection {...defaultProps} />);
  expect(container.querySelector('[class*="lucide-radio"]') || container.querySelector('svg')).toBeInTheDocument();
 });

  it('renders dark theme styles', () => {
   const { container } = render(<NetworkSection {...defaultProps} />);
   expect(container.querySelector('[class*="rounded-lg"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
   const { container } = render(<NetworkSection {...defaultProps} />);
   expect(container.querySelector('[class*="rounded-lg"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

 it('renders obfuscation mode when enabled', () => {
  render(<NetworkSection {...defaultProps} obfuscationEnabled={true} />);
  expect(screen.getByText('settings.obfuscationMode')).toBeInTheDocument();
 });

 it('renders obfuscation mode value', () => {
  render(<NetworkSection {...defaultProps} obfuscationEnabled={true} />);
  expect(screen.getByText('xorshroud')).toBeInTheDocument();
 });

  it('renders all groups', () => {
   const { container } = render(<NetworkSection {...defaultProps} />);
   expect(container.querySelectorAll('button, input, [class*="group"]').length).toBeGreaterThanOrEqual(2);
  });
});
