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
vi.mock('../SettingsView', () => ({ SettingsView: ({ theme }: any) => <div data-testid="settings-view">SettingsView</div> }));
vi.mock('../SystemPulsePlayer/SystemPulsePlayer', () => ({ SystemPulsePlayer: ({ theme }: any) => <div data-testid="system-pulse-player">SystemPulsePlayer</div> }));
vi.mock('../RecordingsScreen', () => ({ RecordingsScreen: ({ theme }: any) => <div data-testid="recordings-screen">RecordingsScreen</div> }));
vi.mock('../MeshRadar', () => ({ MeshRadar: ({ theme }: any) => <div data-testid="mesh-radar">MeshRadar</div> }));
vi.mock('../CompanyContactsView', () => ({ CompanyContactsView: ({ theme }: any) => <div data-testid="company-contacts-view">CompanyContactsView</div> }));

import { FeatureViews } from './FeatureViews';

const defaultProps = {
  view: 'contacts', subView: null, setSubView: vi.fn(),
  contacts: [], setContacts: vi.fn(), showContactPicker: false, setShowContactPicker: vi.fn(),
  setEditingContact: vi.fn(), chats: [], setChats: vi.fn(), setActiveChat: vi.fn(),
  setView: vi.fn(), onCall: vi.fn(), onVideoCall: vi.fn(), onMessage: vi.fn(),
  onBack: vi.fn(),
};

describe('FeatureViews', () => {
  it('renders contacts view with ContactsView', async () => {
    render(<FeatureViews {...defaultProps} view="contacts" />);
    expect(await screen.findByText('ContactsView')).toBeInTheDocument();
  });

  it('renders company view with CompanyContactsView', async () => {
    render(<FeatureViews {...defaultProps} view="company" />);
    expect(await screen.findByText('CompanyContactsView')).toBeInTheDocument();
  });

  it('returns null for unknown view', () => {
    const { container } = render(<FeatureViews {...defaultProps} view="unknown" />);
    expect(container.innerHTML).toBe('');
  });
});
