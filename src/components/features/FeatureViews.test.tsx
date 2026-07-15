import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span' },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}));
vi.mock('../../store', () => ({
  useAppStore: vi.fn(() => ({ activeCall: null, setActiveCall: vi.fn(), setContacts: vi.fn(), callFolders: [], addCallFolder: vi.fn(), removeCallFolder: vi.fn() })),
}));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }) }));

vi.mock('../ContactsView', () => ({ ContactsView: () => <div>ContactsView</div> }));
vi.mock('../Dialpad', () => ({
  Dialpad: () => <div data-testid="dialpad">Dialpad</div>,
}));
vi.mock('../call/CallLogView', () => ({
  CallLogView: () => <div data-testid="call-log-view">CallLogView</div>,
}));
vi.mock('../landing/LandingPage', () => ({ LandingPage: ({ onGetStarted }: any) => <button onClick={onGetStarted}>Get Started</button> }));
vi.mock('../MeshRadar', () => ({ MeshRadar: ({ theme }: any) => <div data-testid="mesh-radar">MeshRadar</div> }));
vi.mock('../SettingsView', () => ({ SettingsView: ({ theme }: any) => <div data-testid="settings-view">SettingsView</div> }));
vi.mock('../SystemPulsePlayer/SystemPulsePlayer', () => ({ SystemPulsePlayer: ({ theme }: any) => <div data-testid="system-pulse-player">SystemPulsePlayer</div> }));
vi.mock('../RecordingsScreen', () => ({ RecordingsScreen: ({ theme }: any) => <div data-testid="recordings-screen">RecordingsScreen</div> }));
vi.mock('../CompanyContactsView', () => ({ CompanyContactsView: ({ theme }: any) => <div data-testid="company-contacts-view">CompanyContactsView</div> }));

import { FeatureViews } from './FeatureViews';

const defaultProps = {
  view: 'hub', subView: null, setSubView: vi.fn(),
  contacts: [], setContacts: vi.fn(), showContactPicker: false, setShowContactPicker: vi.fn(),
  setEditingContact: vi.fn(), chats: [], setChats: vi.fn(), setActiveChat: vi.fn(),
  setView: vi.fn(), onCall: vi.fn(), onVideoCall: vi.fn(), onMessage: vi.fn(),
  onBack: vi.fn(),
};

describe('FeatureViews', () => {
  it('renders hub view with LandingPage', async () => {
    render(<FeatureViews {...defaultProps} view="hub" />);
    expect(await screen.findByText('Get Started')).toBeInTheDocument();
  });

  it('renders pulse view with SystemPulsePlayer', async () => {
    render(<FeatureViews {...defaultProps} view="pulse" />);
    expect(await screen.findByText('SystemPulsePlayer')).toBeInTheDocument();
  });

  it('renders radar view with MeshRadar', async () => {
    render(<FeatureViews {...defaultProps} view="radar" />);
    expect(await screen.findByText('MeshRadar')).toBeInTheDocument();
  });

  it('renders calls view with Dialpad', async () => {
    render(<FeatureViews {...defaultProps} view="calls" />);
    expect(await screen.findByText('Dialpad')).toBeInTheDocument();
  });

  it('returns null for unknown view', () => {
    const { container } = render(<FeatureViews {...defaultProps} view="unknown" />);
    expect(container.innerHTML).toBe('');
  });
});
