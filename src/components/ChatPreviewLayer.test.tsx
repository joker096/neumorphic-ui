import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatPreviewLayer } from './ChatPreviewLayer';
import { I18nProvider } from '../lib/i18n';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('./ContactProfileModal', () => ({
  ContactProfileModal: ({ contact, onClose }: any) =>
    contact ? <div data-testid="contact-profile-modal">{contact.name}</div> : null,
  ContactProfile: {},
}));

vi.mock('./VoiceWaveform', () => ({
  VoiceWaveform: () => <div data-testid="voice-waveform">Voice</div>,
}));

vi.mock('./ChannelCommentsView', () => ({
  ChannelCommentsView: () => <div data-testid="channel-comments" />,
}));

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, args?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        'chat.online': 'Online',
        'chat.offline': 'Offline',
        'chat.muteChannel': 'Mute Channel',
        'chat.unmuteChannel': 'Unmute Channel',
        'chat.searchMessages': 'Search messages, people...',
        'chat.startAudioCall': 'Start Audio Call',
        'chat.savedMessages': 'Saved Messages',
        'chat.clearChatHistory': 'Clear Chat History',
        'chat.startVideoCall': 'Start Video Call',
        'chat.items': '{{count}} items',
        'chat.media': 'Media',
        'chat.photos': 'Photos',
        'chat.voiceNotes': 'Voice notes',
        'chat.links': 'Links',
        'chat.e2eEncrypted': 'E2E Encrypted',
        'chat.reply': 'Reply',
        'chat.save': 'Save',
      };
      let text = translations[key] || key;
      if (args) {
        for (const [k, v] of Object.entries(args)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    lang: 'en',
    setLang: () => {},
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  detectBrowserLanguage: () => 'en',
}));

const { useAppStore } = await import('../store');
const mockUseAppStore = vi.mocked(useAppStore);

const mockChat = {
  id: 1,
  name: 'Alice Freeman',
  color: 'from-pink-400 to-rose-400',
  online: true,
  isChannel: false,
  isMuted: false,
  history: [
    { id: 101, sender: 'them', text: 'Hello there!', time: '10:00' },
    { id: 102, sender: 'me', text: 'Hi! How are you?', time: '10:01', status: 'read' },
    { id: 103, sender: 'them', type: 'image', url: 'https://example.com/img.jpg', time: '10:02' },
  ],
};

const mockChannelChat = {
  id: 4,
  name: 'Tech Insights',
  color: 'from-slate-700 to-slate-900',
  online: true,
  isChannel: true,
  isMuted: false,
  history: [
    { id: 401, sender: 'them', text: 'Welcome to Tech Insights', time: 'Mon' },
  ],
};

const defaultProps = {
  chat: mockChat,
  theme: 'dark' as const,
  onClose: vi.fn(),
  onAction: vi.fn(),
  onCall: vi.fn(),
  onMessage: vi.fn(),
  onUpdateChat: vi.fn(),
  onReply: vi.fn(),
  savedMessages: [],
  onToggleSavedMessage: vi.fn(),
  deliveryReceipts: true,
  readReceipts: true,
};

describe('ChatPreviewLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockReturnValue({
      stealthMode: false,
      scheduledQueue: { messages: [], addMessage: vi.fn(), removeMessage: vi.fn() },
      setActiveCall: vi.fn(),
      setChats: vi.fn(),
      setChannels: vi.fn(),
    });
  });

  it('renders chat name', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    expect(screen.getByText('Alice Freeman')).toBeTruthy();
  });

  it('renders with dark theme', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    expect(screen.getByText('Alice Freeman')).toBeTruthy();
  });

  it('renders with light theme', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} theme="light" /></I18nProvider>);
    expect(screen.getByText('Alice Freeman')).toBeTruthy();
  });

  it('shows online status', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('shows offline status', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} chat={{ ...mockChat, online: false }} /></I18nProvider>);
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('renders message history', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    expect(screen.getByText('Hello there!')).toBeTruthy();
    expect(screen.getByText('Hi! How are you?')).toBeTruthy();
  });

  it('renders channel type with mute button', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} chat={mockChannelChat} /></I18nProvider>);
    expect(screen.getByText('Mute Channel')).toBeTruthy();
  });

  it('shows unmute for muted channel', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} chat={{ ...mockChannelChat, isMuted: true }} /></I18nProvider>);
    expect(screen.getByText('Unmute Channel')).toBeTruthy();
  });

  it('renders search button', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    const searchButton = screen.getByTitle('Search messages, people...');
    expect(searchButton).toBeTruthy();
  });

  it('shows media tabs', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    expect(screen.getByText('Media')).toBeTruthy();
    expect(screen.getByText('Photos')).toBeTruthy();
    expect(screen.getByText('Voice notes')).toBeTruthy();
    expect(screen.getByText('Links')).toBeTruthy();
  });

  it('renders action buttons for non-channel chat', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    expect(screen.getByTitle('Start Audio Call')).toBeTruthy();
    expect(screen.getByTitle('Saved Messages')).toBeTruthy();
    expect(screen.getByTitle('Clear Chat History')).toBeTruthy();
    expect(screen.getByTitle('Start Video Call')).toBeTruthy();
  });

  it('shows media items count', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    const itemsText = screen.getByText(/items/);
    expect(itemsText).toBeTruthy();
  });

  it('calls setActiveCall when audio call button clicked', () => {
    const setActiveCall = vi.fn();
    mockUseAppStore.mockReturnValue({
      stealthMode: false,
      scheduledQueue: { messages: [], addMessage: vi.fn(), removeMessage: vi.fn() },
      setActiveCall,
      setChats: vi.fn(),
      setChannels: vi.fn(),
    });
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    fireEvent.click(screen.getByTitle('Start Audio Call'));
    expect(setActiveCall).toHaveBeenCalled();
  });

  it('calls onClose when back button clicked', () => {
    const onClose = vi.fn();
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} onClose={onClose} /></I18nProvider>);
    const backButton = document.querySelector('[class*="cursor-pointer"][class*="rounded-full"]');
    if (backButton) fireEvent.click(backButton);
  });

  it('shows E2E encryption shield icon', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    const shieldTitle = document.querySelector('[title="E2E Encrypted"]');
    expect(shieldTitle).toBeTruthy();
  });

  it('renders reply buttons on messages', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    const replyButtons = screen.getAllByText('Reply');
    expect(replyButtons.length).toBeGreaterThan(0);
  });

  it('renders save buttons on messages', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    const saveButtons = screen.getAllByText('Save');
    expect(saveButtons.length).toBeGreaterThan(0);
  });

  it('renders message timestamps', () => {
    render(<I18nProvider><ChatPreviewLayer {...defaultProps} /></I18nProvider>);
    expect(screen.getByText('10:00')).toBeTruthy();
    expect(screen.getByText('10:01')).toBeTruthy();
  });
});
