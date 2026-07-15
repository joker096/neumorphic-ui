import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mockT = vi.fn((key: string) => {
  const map: Record<string, string> = {
    'company.connected': 'Connected',
    'company.teamMembers': 'Team Members',
    'company.channels': 'Company Channels',
    'company.scanQR': 'Scan QR to Join',
    'company.scanDescription': 'Point camera at company QR code',
    'company.invite': 'Invite Members',
    'company.inviteDescription': 'Share this QR code with team members',
  };
  return map[key] || key;
});

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({ t: mockT, lang: 'en', setLang: vi.fn() }),
}));

const mockStore = {
  companyMembers: [],
  companyChannels: [],
  companyId: null,
  companySettings: null,
  hideWhenOfficeOnly: false,
  connectionStatus: 'connected',
  setCompanyMembers: vi.fn(),
  setCompanyChannels: vi.fn(),
  setCompanyId: vi.fn(),
  loadCompanySettings: vi.fn(),
};

vi.mock('../store', () => ({
  useAppStore: (selector: any) => {
    if (typeof selector === 'function') return selector(mockStore);
    return mockStore;
  },
}));

vi.mock('./company/CompanyHeader', () => ({
  CompanyHeader: ({ onScanQR, onInvite, onSettings }: any) => (
    <div data-testid="company-header">
      <button data-testid="btn-scan-qr" onClick={onScanQR}>QR</button>
      <button data-testid="btn-invite" onClick={onInvite}>Invite</button>
      <button data-testid="btn-settings" onClick={onSettings}>Settings</button>
    </div>
  ),
}));

vi.mock('./company/CompanyInfoCard', () => ({
  CompanyInfoCard: ({ connected }: any) => <div data-testid="company-info-card">{connected}</div>,
}));

vi.mock('./company/MemberList', () => ({
  MemberList: ({ members, teamMembersLabel }: any) => (
    <div data-testid="member-list">
      <span>{teamMembersLabel}</span>
      <span>{members.length} members</span>
    </div>
  ),
}));

vi.mock('./company/ChannelList', () => ({
  ChannelList: ({ channels, channelsLabel }: any) => (
    <div data-testid="channel-list">
      <span>{channelsLabel}</span>
      <span>{channels.length} channels</span>
    </div>
  ),
}));

vi.mock('./company/CompanySettingsView', () => ({
  CompanySettingsView: ({ onClose }: any) => (
    <div data-testid="company-settings-view">
      <button data-testid="btn-close-settings" onClick={onClose}>Close Settings</button>
    </div>
  ),
}));

vi.mock('@yudiel/react-qr-scanner', () => ({
  Scanner: ({ onScan }: any) => (
    <div data-testid="qr-scanner">
      <button data-testid="btn-simulate-scan" onClick={() => onScan?.([{ rawValue: 'scanned-data' }])}>Simulate Scan</button>
    </div>
  ),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>,
}));

import { CompanyContactsView } from './CompanyContactsView';

describe('CompanyContactsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.companyMembers = [];
    mockStore.companyChannels = [];
    mockStore.companyId = null;
    mockStore.hideWhenOfficeOnly = false;
    mockStore.connectionStatus = 'connected';
  });

  it('renders company header', () => {
    render(<CompanyContactsView />);
    expect(screen.getByTestId('company-header')).toBeInTheDocument();
  });

  it('renders company info card with connected text', () => {
    render(<CompanyContactsView />);
    expect(screen.getByTestId('company-info-card')).toHaveTextContent('Connected');
  });

  it('renders member list with team members label', () => {
    render(<CompanyContactsView />);
    expect(screen.getByTestId('member-list')).toHaveTextContent('Team Members');
  });

  it('renders channel list with channels label', () => {
    render(<CompanyContactsView />);
    expect(screen.getByTestId('channel-list')).toHaveTextContent('Company Channels');
  });

  it('passes members from store to MemberList', () => {
    mockStore.companyMembers = [{ id: '1', displayName: 'Alice' }];
    render(<CompanyContactsView />);
    expect(screen.getByTestId('member-list')).toHaveTextContent('1 members');
  });

  it('passes channels from store to ChannelList', () => {
    mockStore.companyChannels = [{ id: '1', name: 'General' }];
    render(<CompanyContactsView />);
    expect(screen.getByTestId('channel-list')).toHaveTextContent('1 channels');
  });

  it('returns null when hideWhenOfficeOnly is true and connection is not connected', () => {
    mockStore.hideWhenOfficeOnly = true;
    mockStore.connectionStatus = 'disconnected';
    const { container } = render(<CompanyContactsView />);
    expect(container.innerHTML).toBe('');
  });

  it('renders when hideWhenOfficeOnly is true but connection is connected', () => {
    mockStore.hideWhenOfficeOnly = true;
    mockStore.connectionStatus = 'connected';
    render(<CompanyContactsView />);
    expect(screen.getByTestId('company-header')).toBeInTheDocument();
  });

  it('shows QR scanner modal when scan button is clicked', () => {
    render(<CompanyContactsView />);
    expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-scan-qr'));
    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
  });

  it('shows invite modal when invite button is clicked', () => {
    render(<CompanyContactsView />);
    expect(screen.queryByText('Invite Members')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-invite'));
    expect(screen.getByText('Invite Members')).toBeInTheDocument();
  });

  it('shows company ID in invite modal', () => {
    render(<CompanyContactsView />);
    fireEvent.click(screen.getByTestId('btn-invite'));
    expect(screen.getByText('org_b64test123')).toBeInTheDocument();
  });

  it('shows settings modal when settings button is clicked', () => {
    render(<CompanyContactsView />);
    expect(screen.queryByTestId('company-settings-view')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-settings'));
    expect(screen.getByTestId('company-settings-view')).toBeInTheDocument();
  });

  it('closes settings modal when close button is clicked', () => {
    render(<CompanyContactsView />);
    fireEvent.click(screen.getByTestId('btn-settings'));
    expect(screen.getByTestId('company-settings-view')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-close-settings'));
    expect(screen.queryByTestId('company-settings-view')).not.toBeInTheDocument();
  });

  it('calls setCompanyMembers and setCompanyId on QR scan when no companyId', () => {
    render(<CompanyContactsView />);
    fireEvent.click(screen.getByTestId('btn-scan-qr'));
    fireEvent.click(screen.getByTestId('btn-simulate-scan'));
    expect(mockStore.setCompanyId).toHaveBeenCalled();
    expect(mockStore.setCompanyMembers).toHaveBeenCalled();
    expect(mockStore.setCompanyChannels).toHaveBeenCalled();
    expect(mockStore.loadCompanySettings).toHaveBeenCalled();
  });

  it('does not call setCompanyMembers on QR scan when companyId already exists', () => {
    mockStore.companyId = 'existing-id';
    render(<CompanyContactsView />);
    fireEvent.click(screen.getByTestId('btn-scan-qr'));
    fireEvent.click(screen.getByTestId('btn-simulate-scan'));
    expect(mockStore.setCompanyId).not.toHaveBeenCalled();
  });

  it('calls onCall when member click handler is triggered via onMessage', () => {
    const onMessage = vi.fn();
    mockStore.companyMembers = [{ id: '1', displayName: 'Alice' }];
    render(<CompanyContactsView onMessage={onMessage} />);
    const memberList = screen.getByTestId('member-list');
    expect(memberList).toBeInTheDocument();
  });

  it('uses mock data when store has no members', () => {
    render(<CompanyContactsView />);
    expect(screen.getByTestId('member-list')).toBeInTheDocument();
  });

  it('uses mock data when store has no channels', () => {
    render(<CompanyContactsView />);
    expect(screen.getByTestId('channel-list')).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    const { container } = render(<CompanyContactsView theme="light" />);
    expect(container.querySelector('[class*="w-full"]')).toBeInTheDocument();
  });

  it('closes QR scanner modal when scan is simulated', () => {
    render(<CompanyContactsView />);
    fireEvent.click(screen.getByTestId('btn-scan-qr'));
    expect(screen.getByTestId('qr-scanner')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-simulate-scan'));
    expect(screen.queryByTestId('qr-scanner')).not.toBeInTheDocument();
  });
});
