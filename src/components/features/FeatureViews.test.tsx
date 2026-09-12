import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span' },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}));
vi.mock('../../store', () => {
  const state = {
    userProfile: { id: 'u1', name: 'User' },
    companyMembers: [],
    activeCall: null,
    setActiveCall: vi.fn(),
    setContacts: vi.fn(),
    callFolders: [],
    addCallFolder: vi.fn(),
    removeCallFolder: vi.fn(),
    activeBotId: 'bot_1',
    setActiveBotId: vi.fn(),
    miniAppBotId: null,
    setMiniAppBotId: vi.fn(),
  };
  return { useAppStore: vi.fn((selector?: (s: typeof state) => any) => (selector ? selector(state) : state)) };
});
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }) }));

vi.mock('../ContactsView', () => ({ ContactsView: () => <div>ContactsView</div> }));
vi.mock('../SettingsView', () => ({ SettingsView: ({ theme }: any) => <div data-testid="settings-view">SettingsView</div> }));
vi.mock('../SystemPulsePlayer/SystemPulsePlayer', () => ({ SystemPulsePlayer: ({ theme }: any) => <div data-testid="system-pulse-player">SystemPulsePlayer</div> }));
vi.mock('../RecordingsScreen', () => ({ RecordingsScreen: ({ theme }: any) => <div data-testid="recordings-screen">RecordingsScreen</div> }));
vi.mock('../MeshRadar', () => ({ MeshRadar: ({ theme }: any) => <div data-testid="mesh-radar">MeshRadar</div> }));
let capturedOnOpenPremium: (() => void) | undefined;
vi.mock('../crm/CrmView', () => ({ CrmView: ({ onOpenPremium }: any) => { capturedOnOpenPremium = onOpenPremium; return <div data-testid="crm-view">CrmView</div>; } }));
vi.mock('../settings/PremiumSection', () => ({ PremiumSection: ({ onBack }: any) => { capturedPremiumBack = onBack; return <div data-testid="premium-section">PremiumSection</div>; } }));

let capturedOnStart: ((botName: string) => void) | undefined;
vi.mock('./bot/BotProfileView', () => ({ BotProfileView: ({ onStart }: any) => { capturedOnStart = onStart; return <div data-testid="bot-profile">BotProfileView</div>; } }));
let capturedPremiumBack: (() => void) | undefined;

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

  it('renders company view with CrmView', async () => {
    render(<FeatureViews {...defaultProps} view="company" />);
    expect(await screen.findByText('CrmView')).toBeInTheDocument();
  });

  it('renders premium subview in settings with back to settings', async () => {
    const setSubView = vi.fn();
    capturedPremiumBack = undefined;
    render(<FeatureViews {...defaultProps} view="settings" subView="premium" setSubView={setSubView} />);
    expect(await screen.findByTestId('premium-section')).toBeInTheDocument();
    expect(capturedPremiumBack).toBeTypeOf('function');
    capturedPremiumBack?.();
    expect(setSubView).toHaveBeenCalledWith(null);
  });

  it('company: onOpenPremium navigates to premium subview (D5 regress)', async () => {
    const setSubView = vi.fn();
    const setView = vi.fn();
    capturedOnOpenPremium = undefined;
    render(<FeatureViews {...defaultProps} view="company" setSubView={setSubView} setView={setView} />);
    expect(await screen.findByTestId('crm-view')).toBeInTheDocument();
    expect(capturedOnOpenPremium).toBeTypeOf('function');
    capturedOnOpenPremium?.();
    expect(setSubView).toHaveBeenCalledWith('premium');
    expect(setView).toHaveBeenCalledWith('settings');
  });

  it('returns null for unknown view', () => {
    const { container } = render(<FeatureViews {...defaultProps} view="unknown" />);
    expect(container.innerHTML).toBe('');
  });

  it('bot view Start (onStart) opens chat via onMessage (D5 regress)', async () => {
    const onMessage = vi.fn();
    const setView = vi.fn();
    capturedOnStart = undefined;
    render(<FeatureViews {...defaultProps} view="bot" onMessage={onMessage} setView={setView} />);
    expect(await screen.findByTestId('bot-profile')).toBeInTheDocument();
    expect(capturedOnStart).toBeTypeOf('function');
    capturedOnStart?.('HelperBot');
    expect(onMessage).toHaveBeenCalledWith('HelperBot');
    expect(setView).toHaveBeenCalledWith('chats');
  });
});
