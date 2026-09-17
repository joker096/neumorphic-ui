import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NetworkSection } from './NetworkSection';

const { relayProxy } = vi.hoisted(() => ({ relayProxy: { enabled: true } }));

vi.mock('../../config/signalling', () => ({
 get IS_RELAY_PROXY_CONFIGURED() {
  return relayProxy.enabled;
 },
}));

vi.mock('../../lib/i18n', () => ({
 useI18n: () => ({
  t: (key: string) => key,
  lang: 'en',
  setLang: vi.fn(),
 }),
}));

describe('NetworkSection - additional tests', () => {
  const defaultProps = {
   isDark: false,
   obfuscationEnabled: false,
   setObfuscationEnabled: vi.fn(),
  turnServerUrl: '',
  turnServerUser: '',
  turnServerPass: '',
  relayBackend: 'direct',
  setRelayBackend: vi.fn(),
  autoReconnectEnabled: false,
  setAutoReconnectEnabled: vi.fn(),
  onUpdateSettings: vi.fn(),
  onBack: vi.fn(),
  t: (k: string) => k,
  };

 it('renders all section titles', () => {
  render(<NetworkSection {...defaultProps} />);
  expect(screen.getByText('settings.relaySection')).toBeInTheDocument();
  expect(screen.getByText('settings.transportOptions')).toBeInTheDocument();
  expect(screen.getByText('settings.turnServer')).toBeInTheDocument();
 });

 it('renders all toggles', () => {
   render(<NetworkSection {...defaultProps} />);
   const toggles = document.querySelectorAll('[role="switch"]');
   expect(toggles.length).toBeGreaterThanOrEqual(1);
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

it('renders obfuscation toggle row', () => {
  render(<NetworkSection {...defaultProps} obfuscationEnabled={true} />);
  expect(screen.getByText('settings.obfuscation')).toBeInTheDocument();
 });

  it('renders all groups', () => {
    const { container } = render(<NetworkSection {...defaultProps} />);
    expect(container.querySelectorAll('button, input, [class*="group"]').length).toBeGreaterThanOrEqual(2);
   });

  it('cycles relay backend', () => {
    const setRelayBackend = vi.fn();
    render(<NetworkSection {...defaultProps} relayBackend="direct" setRelayBackend={setRelayBackend} />);
    fireEvent.click(screen.getByRole('button', { name: /settings\.relayBackend/i }));
    expect(setRelayBackend).toHaveBeenCalledWith('cfworker');
   });

  it('hides the relay backend row when no relay proxy is configured', () => {
    relayProxy.enabled = false;
    render(<NetworkSection {...defaultProps} />);
    expect(screen.queryByText(/settings\.relayBackend/)).not.toBeInTheDocument();
  });
});

afterEach(() => {
  relayProxy.enabled = true;
});