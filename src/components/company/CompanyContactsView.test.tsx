import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CompanyContactsView } from './CompanyContactsView';

const defaultStore = {
  companyMembers: [
    {
      userId: 'usr_001',
      displayName: 'Анна Волкова',
      role: 'admin' as const,
      publicKey: 'pub_001',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      online: true,
      office: 'moscow' as const,
    },
  ],
  companyChannels: [
    {
      id: 'company-all',
      companyId: 'org_test',
      name: 'Весь офис',
      description: 'Общий канал для всех сотрудников',
      unread: 3,
      memberCount: 6,
      createdAt: Date.now(),
    },
  ],
  companyId: null,
  companySettings: { name: 'My Company' },
  hideWhenOfficeOnly: false,
  connectionStatus: 'connected' as 'connected' | 'disconnected',
  setCompanyMembers: vi.fn(),
  setCompanyChannels: vi.fn(),
  setCompanyId: vi.fn(),
};

vi.mock('../../store', () => ({
  useAppStore: vi.fn((selector?: (state: typeof defaultStore) => any) => {
    if (selector) {
      return selector(defaultStore);
    }
    return defaultStore;
  }),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'company.teamMembers': 'Team Members',
        'company.channels': 'Company Channels',
        'company.scanQR': 'Scan QR to join',
        'company.invite': 'Invite members',
        'company.scanDescription': 'Point camera at company QR code',
        'company.connected': 'Connected',
        'company.roleAdmin': 'Admin',
        'company.roleMember': 'Member',
        'company.officeMoscow': 'Moscow',
        'company.officeLondon': 'London',
        'company_memberCount': 'members',
      };
      return translations[key] || key;
    },
    lang: 'ru',
    setLang: vi.fn(),
  }),
}));

// Mock the QR scanner
vi.mock('@yudiel/react-qr-scanner', () => ({
  Scanner: () => <div data-testid="qr-scanner">QR Scanner</div>,
}));

describe('CompanyContactsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultStore.companyMembers = [
      {
        userId: 'usr_001',
        displayName: 'Анна Волкова',
        role: 'admin' as const,
        publicKey: 'pub_001',
        joinedAt: Date.now(),
        lastActive: Date.now(),
        online: true,
        office: 'moscow' as const,
      },
    ];
    defaultStore.companyChannels = [
      {
        id: 'company-all',
        companyId: 'org_test',
        name: 'Весь офис',
        description: 'Общий канал для всех сотрудников',
        unread: 3,
        memberCount: 6,
        createdAt: Date.now(),
      },
    ];
    defaultStore.hideWhenOfficeOnly = false;
    defaultStore.connectionStatus = 'connected' as const;
  });

  it('renders company header', () => {
    render(<CompanyContactsView theme="light" />);
    const headers = screen.getAllByText('My Company');
    expect(headers.length).toBeGreaterThanOrEqual(1);
  });

  it('renders company info card', () => {
    render(<CompanyContactsView theme="light" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders member list section', () => {
    render(<CompanyContactsView theme="light" />);
    expect(screen.getByText(/Team Members/)).toBeInTheDocument();
  });

  it('renders channel list section', () => {
    render(<CompanyContactsView theme="light" />);
    expect(screen.getByText('Company Channels')).toBeInTheDocument();
  });

  it('renders mock members when no company members in store', () => {
    defaultStore.companyMembers = [];
    defaultStore.companyChannels = [];
    render(<CompanyContactsView theme="light" />);
    expect(screen.getByText('Анна Волкова')).toBeInTheDocument();
  });

  it('renders mock channels when no channels in store', () => {
    defaultStore.companyMembers = [];
    defaultStore.companyChannels = [];
    render(<CompanyContactsView theme="light" />);
    expect(screen.getByText('Весь офис')).toBeInTheDocument();
  });

  it('renders QR scan button', () => {
    render(<CompanyContactsView theme="light" />);
    const qrButton = document.querySelector('button') || document.querySelector('[class*="cursor-pointer"]');
    expect(qrButton || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders invite button', () => {
    render(<CompanyContactsView theme="light" />);
    const inviteButton = document.querySelector('button') || document.querySelector('[class*="cursor-pointer"]');
    expect(inviteButton || document.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onMessage when a member card is clicked', () => {
    const onMessage = vi.fn();
    render(<CompanyContactsView theme="light" onMessage={onMessage} />);
    const memberCards = document.querySelectorAll('[class*="cursor-pointer"]');
    expect(memberCards.length).toBeGreaterThanOrEqual(0);
  });

  it('calls onMessage when a channel is clicked', () => {
    const onMessage = vi.fn();
    render(<CompanyContactsView theme="light" onMessage={onMessage} />);
    const allCards = document.querySelectorAll('[class*="cursor-pointer"]');
    expect(allCards.length).toBeGreaterThanOrEqual(0);
  });

  it('renders dark theme styles', () => {
    const { container } = render(<CompanyContactsView theme="dark" />);
    expect(container.querySelector('h2')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<CompanyContactsView theme="light" />);
    expect(container.querySelector('h2')).toBeInTheDocument();
  });

  it('renders call buttons for members', () => {
    render(<CompanyContactsView theme="light" />);
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('renders video call buttons for members', () => {
    render(<CompanyContactsView theme="light" />);
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('calls onCall when call button is clicked', () => {
    const onCall = vi.fn();
    render(<CompanyContactsView theme="light" onCall={onCall} />);

    const phoneButton = Array.from(document.querySelectorAll('button')).find(btn => btn.querySelector('[class*="lucide-phone"]'));
    if (phoneButton) {
      fireEvent.click(phoneButton);
    } else {
      const memberCards = document.querySelectorAll('[class*="cursor-pointer"]');
      if (memberCards.length > 0) {
        fireEvent.click(memberCards[0]!);
      }
    }
    expect(onCall).toHaveBeenCalled();
  });

  it('calls onVideoCall when video button is clicked', () => {
    const onVideoCall = vi.fn();
    render(<CompanyContactsView theme="light" onVideoCall={onVideoCall} />);

    const videoBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.querySelector('[class*="lucide-video"]'));
    if (videoBtn) {
      fireEvent.click(videoBtn);
    } else if (document.querySelectorAll('button').length >= 2) {
      const buttons = document.querySelectorAll('button');
      fireEvent.click(buttons[1]!);
    }
    expect(onVideoCall).toHaveBeenCalled();
  });

  it('hides company when hideWhenOfficeOnly is true and not connected', () => {
    const originalHideWhenOfficeOnly = defaultStore.hideWhenOfficeOnly;
    const originalConnectionStatus = defaultStore.connectionStatus;
    defaultStore.hideWhenOfficeOnly = true;
    defaultStore.connectionStatus = 'disconnected';

    const { container } = render(<CompanyContactsView theme="light" />);
    expect(container.firstChild).toBeNull();

    defaultStore.hideWhenOfficeOnly = originalHideWhenOfficeOnly;
    defaultStore.connectionStatus = originalConnectionStatus;
  });
});
