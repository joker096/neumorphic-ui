import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Camera: 'div', Trash2: 'div', X: 'div', Check: 'div', Upload: 'div',
  Plus: 'div', Share2: 'div', Copy: 'div', QrCode: 'div', Edit: 'div',
  Mail: 'div', MessageSquare: 'div', Phone: 'div', Send: 'div',
  Shield: 'div', AtSign: 'div', ChevronLeft: 'div', ChevronRight: 'div',
  RotateCcw: 'div',
}));

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: (key: string, initial: any) => {
    const val = vi.fn();
    return [initial, val];
  },
}));

let currentProfile: any = { name: 'Test User', bio: 'Hello', status: 'Working', avatar: '', fields: [] };

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector?.({
    userProfile: currentProfile,
    setUserProfile: vi.fn(),
  }),
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string, fallback?: string) => fallback || k }) }));

import { ProfileSection } from './ProfileSection';

describe('ProfileSection', () => {
  beforeEach(() => {
    currentProfile = { name: 'Test User', bio: 'Hello', status: 'Working', avatar: '', fields: [] };
  });

  it('renders profile section title', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    expect(screen.getByText('Profile & Accounts')).toBeInTheDocument();
  });

  it('renders user name', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders bio', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders edit profile button', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('renders accounts list', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    expect(screen.getByText('Nexus Terminal')).toBeInTheDocument();
    expect(screen.getByText('Work Node')).toBeInTheDocument();
  });

  it('renders add account button', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    expect(screen.getByText('Add Account')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByText('Save Profile')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders status field in edit mode', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Working')).toBeInTheDocument();
  });

  it('renders upload photo button when no avatar', () => {
    currentProfile = { name: 'Test User', bio: 'Hello', avatar: '', fields: [] };
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
  });

  it('renders change and remove photo buttons when avatar exists', () => {
    currentProfile = { name: 'Test User', bio: 'Hello', avatar: 'data:image/png;base64,abc', fields: [] };
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    fireEvent.click(screen.getByText('Edit Profile'));
    expect(screen.getByText('Change Photo')).toBeInTheDocument();
    expect(screen.getByText('Remove Photo')).toBeInTheDocument();
  });

  it('renders share identity button', () => {
    render(<ProfileSection onBack={vi.fn()} t={(k: string, fallback?: string) => fallback || k} />);
    expect(screen.getByText('Share Identity')).toBeInTheDocument();
  });
});
