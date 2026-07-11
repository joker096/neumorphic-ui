import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

vi.mock('../contacts/ContactsView', () => ({ ContactsView: () => <div>ContactsView</div> }));
vi.mock('../call/Dialpad', () => ({
  Dialpad: () => <div data-testid="dialpad">Dialpad</div>,
}));
vi.mock('../Dialpad', () => ({
  Dialpad: () => <div data-testid="dialpad">Dialpad</div>,
}));
vi.mock('../call/CallLogView', () => ({
  CallLogView: () => <div data-testid="call-log-view">CallLogView</div>,
}));
vi.mock('../landing/LandingPage', () => ({ LandingPage: ({ onGetStarted }: any) => <button onClick={onGetStarted}>Get Started</button> }));
vi.mock('../MeshRadar', () => ({ MeshRadar: ({ theme }: any) => <div data-testid="mesh-radar">MeshRadar</div> }));
vi.mock('../settings/SettingsView', () => ({ SettingsView: ({ theme }: any) => <div data-testid="settings-view">SettingsView</div> }));
vi.mock('../SystemPulsePlayer/SystemPulsePlayer', () => ({ SystemPulsePlayer: ({ theme }: any) => <div data-testid="system-pulse-player">SystemPulsePlayer</div> }));
vi.mock('../company/CompanyContactsView', () => ({ CompanyContactsView: ({ theme }: any) => <div data-testid="company-contacts-view">CompanyContactsView</div> }));

import { FeatureViews } from './FeatureViews';

const defaultProps = {
  view: 'hub', subView: null, setSubView: vi.fn(),
  contacts: [], setContacts: vi.fn(), showContactPicker: false, setShowContactPicker: vi.fn(),
  setEditingContact: vi.fn(), chats: [], setChats: vi.fn(), setActiveChat: vi.fn(),
  setView: vi.fn(), onCall: vi.fn(), onVideoCall: vi.fn(), onMessage: vi.fn(),
  onBack: vi.fn(),
};

describe('FeatureViews', () => {
  it('renders hub view with LandingPage', () => {
    render(<FeatureViews {...defaultProps} view="hub" />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders pulse view with SystemPulsePlayer', () => {
    render(<FeatureViews {...defaultProps} view="pulse" />);
    expect(screen.getByText('SystemPulsePlayer')).toBeInTheDocument();
  });

  it('renders radar view with MeshRadar', () => {
    render(<FeatureViews {...defaultProps} view="radar" />);
    expect(screen.getByText('MeshRadar')).toBeInTheDocument();
  });

  it('renders calls view with Dialpad', () => {
    render(<FeatureViews {...defaultProps} view="calls" />);
    expect(screen.getByText('Dialpad')).toBeInTheDocument();
  });

  it('returns null for unknown view', () => {
    const { container } = render(<FeatureViews {...defaultProps} view="unknown" />);
    expect(container.innerHTML).toBe('');
  });
});
