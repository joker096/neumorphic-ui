import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsMainMenu } from './SettingsMainMenu';
import { APP_INFO } from '../../config/settingsDefaults';
import type { CloudSyncState } from '../../store/types';

// --- mocks ---

let premiumActive = false;

vi.mock('../../store', () => ({
  useAppStore: (selector?: any) => {
    const state = { premiumEntitlement: { premium: premiumActive } };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('lucide-react', () => ({
  Activity: 'div', Bell: 'div', BellOff: 'div', Bot: 'div', Building2: 'div',
  ChevronRight: 'div', Cloud: 'div', Globe: 'div', HardDrive: 'div', Lock: 'div',
  Monitor: 'div', Network: 'div', Palette: 'div', Phone: 'div', Radar: 'div',
  Search: 'div', Shield: 'div', ShieldAlert: 'div', Smartphone: 'div', User: 'div',
  FolderTree: 'div', Download: 'div', HelpCircle: 'div', CreditCard: 'div',
  Receipt: 'div', Crown: 'div', X: 'div',
}));

const t = (key: string, fallback?: any) => (typeof fallback === 'string' ? fallback : key);

const baseProps = {
  isDark: false,
  searchQuery: '',
  setSearchQuery: vi.fn(),
  t,
  setActiveSection: vi.fn(),
  setSubView: vi.fn(),
  notificationsEnabled: false,
  setNotificationsEnabled: vi.fn(),
  soundEnabled: false,
  setSoundEnabled: vi.fn(),
  soundVolume: 0.7,
  setSoundVolume: vi.fn(),
  cloudSync: {
    enabled: false, status: 'idle', pendingChanges: 0, lastSync: null,
    errorMessage: null, provider: 'local',
  } as CloudSyncState,
  setCloudSyncEnabled: vi.fn(),
  language: 'en',
};

type MenuProps = typeof baseProps;

const renderMenu = (overrides: Partial<MenuProps> = {}) =>
  render(<SettingsMainMenu {...baseProps} {...overrides} />);

beforeEach(() => {
  premiumActive = false;
  vi.clearAllMocks();
});

afterEach(() => {
  delete (window as any).Notification;
});

describe('SettingsMainMenu — search', () => {
  it('renders search input with placeholder key', () => {
    renderMenu();
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-label', 'settings.searchPlaceholder');
  });

  it('reflects searchQuery value', () => {
    renderMenu({ searchQuery: 'admin' });
    expect(screen.getByRole('textbox')).toHaveValue('admin');
  });

  it('fires setSearchQuery on change', () => {
    renderMenu();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'radar' } });
    expect(baseProps.setSearchQuery).toHaveBeenCalledWith('radar');
  });

  it('fires setSearchQuery("") on clear button', () => {
    renderMenu({ searchQuery: 'xyz' });
    fireEvent.click(screen.getByRole('button', { name: 'search.clear' }));
    expect(baseProps.setSearchQuery).toHaveBeenCalledWith('');
  });
});

describe('SettingsMainMenu — big menu buttons', () => {
  it('profile button opens profile section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('Profile & Accounts'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('profile');
  });

  it('storage button opens storage section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.dataStorage'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('storage');
  });

  it('company button opens company section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.company'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('company');
  });
});

describe('SettingsMainMenu — appearance group', () => {
  it('theme item opens appearance section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.theme'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('appearance');
  });

  it('language item opens language section and shows current language as subtitle', () => {
    renderMenu({ language: 'ru' });
    expect(screen.getByText('ru')).toBeInTheDocument();
    fireEvent.click(screen.getByText('settings.language'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('language');
  });
});

describe('SettingsMainMenu — notifications card', () => {
  it('clicking the row opens notifications section without toggling state', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.notifications'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('notifications');
    expect(baseProps.setNotificationsEnabled).not.toHaveBeenCalled();
  });

  it('notifications switch toggles to opposite value', () => {
    renderMenu({ notificationsEnabled: false });
    fireEvent.click(screen.getByRole('switch', { name: 'settings.notifications' }));
    expect(baseProps.setNotificationsEnabled).toHaveBeenCalledWith(true);
  });

  it('notifications switch on state toggles off', () => {
    renderMenu({ notificationsEnabled: true });
    fireEvent.click(screen.getByRole('switch', { name: 'settings.notifications' }));
    expect(baseProps.setNotificationsEnabled).toHaveBeenCalledWith(false);
  });

  it('sound switch toggles sound', () => {
    renderMenu({ soundEnabled: false });
    fireEvent.click(screen.getByRole('switch', { name: 'settings.sound' }));
    expect(baseProps.setSoundEnabled).toHaveBeenCalledWith(true);
  });

  it('cloud sync switch toggles cloud sync', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('switch', { name: 'settings.cloudSyncOption' }));
    expect(baseProps.setCloudSyncEnabled).toHaveBeenCalledWith(true);
  });

  it('switch click does not bubble to the card row (no double toggle)', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('switch', { name: 'settings.notifications' }));
    expect(baseProps.setActiveSection).not.toHaveBeenCalled();
  });
});

describe('SettingsMainMenu — notification permission effect', () => {
  it('requests permission when enabled and permission default', () => {
    const requestPermission = vi.fn().mockResolvedValue({});
    (window as any).Notification = { permission: 'default', requestPermission };
    renderMenu({ notificationsEnabled: true });
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('does not request permission when disabled', () => {
    const requestPermission = vi.fn().mockResolvedValue({});
    (window as any).Notification = { permission: 'default', requestPermission };
    renderMenu({ notificationsEnabled: false });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('does not request permission when already granted', () => {
    const requestPermission = vi.fn().mockResolvedValue({});
    (window as any).Notification = { permission: 'granted', requestPermission };
    renderMenu({ notificationsEnabled: true });
    expect(requestPermission).not.toHaveBeenCalled();
  });
});

describe('SettingsMainMenu — cloud sync status subtitle', () => {
  const baseCloudSync = {
    enabled: true, status: 'idle' as const, pendingChanges: 0, lastSync: null,
    errorMessage: null, provider: 'local' as const,
  };

  it('shows syncing status', () => {
    renderMenu({ cloudSync: { ...baseCloudSync, status: 'syncing' } });
    expect(screen.getByText('Syncing…')).toBeInTheDocument();
  });

  it('shows error status', () => {
    renderMenu({ cloudSync: { ...baseCloudSync, status: 'error' } });
    expect(screen.getByText('Sync failed')).toBeInTheDocument();
  });

  it('shows pending changes count', () => {
    renderMenu({ cloudSync: { ...baseCloudSync, status: 'idle', pendingChanges: 2 } });
    expect(screen.getByText('settings.cloudSyncPending')).toBeInTheDocument();
  });

  it('shows last sync time', () => {
    renderMenu({ cloudSync: { ...baseCloudSync, status: 'idle', lastSync: 1767186000000 } });
    expect(screen.getByText('settings.cloudSyncLastSync')).toBeInTheDocument();
  });

  it('hides subtitle when cloud sync disabled', () => {
    renderMenu({
      cloudSync: {
        ...baseCloudSync, enabled: false, status: 'error',
      },
    });
    expect(screen.queryByText('Sync failed')).not.toBeInTheDocument();
  });
});

describe('SettingsMainMenu — privacy group', () => {
  it.each([
    ['settings.security', 'security'],
    ['settings.privacy', 'privacy'],
    ['Devices', 'devices'],
  ])('%s opens %s section', (label, section) => {
    renderMenu();
    fireEvent.click(screen.getByText(label));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith(section);
  });
});

describe('SettingsMainMenu — chats & calls groups', () => {
  it('folders item opens folders section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.folders'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('folders');
  });

  it('calls item opens calls section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('Call settings'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('calls');
  });
});

describe('SettingsMainMenu — data storage card', () => {
  it('backup nav item opens backup section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.backupExport'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('backup');
  });
});

describe('SettingsMainMenu — services group', () => {
  it('premium item opens premium section with inactive subtitle', () => {
    renderMenu();
    expect(screen.getByText('Unlock premium features')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Premium'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('premium');
  });

  it('premium subtitle shows Active when premium enabled in store', () => {
    premiumActive = true;
    renderMenu();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('bots item opens bots section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.bots'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('bots');
  });

  it('radar item opens radar subview', () => {
    renderMenu();
    fireEvent.click(screen.getByText('nav.radar'));
    expect(baseProps.setSubView).toHaveBeenCalledWith('radar');
  });

  it('payments item opens payments section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('settings.payments'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('payments');
  });

  it('payment requests item opens paymentRequests section', () => {
    renderMenu();
    fireEvent.click(screen.getByText('Payment Requests'));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith('paymentRequests');
  });
});

describe('SettingsMainMenu — advanced group', () => {
  it.each([
    ['settings.network', 'network'],
    ['settings.systemStatus', 'systemStatus'],
    ['settings.helpSupport', 'help'],
  ])('%s opens %s section', (label, section) => {
    renderMenu();
    fireEvent.click(screen.getByText(label));
    expect(baseProps.setActiveSection).toHaveBeenCalledWith(section);
  });

  it('network subtitle reflects connection fallback', () => {
    renderMenu();
    expect(screen.getByText('Relay, transport and connection')).toBeInTheDocument();
  });
});

describe('SettingsMainMenu — footer', () => {
  it('renders build date', () => {
    renderMenu();
    expect(screen.getByText(`settings.lastBuild: ${APP_INFO.BUILD_DATE}`)).toBeInTheDocument();
  });
});