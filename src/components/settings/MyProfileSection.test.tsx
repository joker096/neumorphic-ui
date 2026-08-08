import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));

vi.mock('lucide-react', () => ({
  Camera: 'div', Edit: 'div', Trash2: 'div', X: 'div', Check: 'div',
  Phone: 'div', Mail: 'div', MessageSquare: 'div',
  Send: 'div', Shield: 'div', AtSign: 'div', Upload: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));

let currentProfile: any = { name: 'Test User', bio: 'Hello', status: 'Working', avatar: '', fields: [] };

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector?.({
    userProfile: currentProfile,
    setUserProfile: vi.fn(),
  }),
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import { MyProfileSection } from './MyProfileSection';

describe('MyProfileSection', () => {
  beforeEach(() => {
    currentProfile = { name: 'Test User', bio: 'Hello', status: 'Working', avatar: '', fields: [] };
  });

  it('renders profile title', () => {
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.myProfile')).toBeInTheDocument();
  });

  it('renders user name', () => {
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders bio', () => {
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders edit profile button', () => {
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    expect(screen.getByText('settings.editProfile')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getByText('settings.editProfile'));
    expect(screen.getByText('settings.saveProfile')).toBeInTheDocument();
    expect(screen.getByText('settings.cancel')).toBeInTheDocument();
  });

  it('renders status field in edit mode', () => {
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getByText('settings.editProfile'));
    expect(screen.getByText('settings.status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Working')).toBeInTheDocument();
  });

  it('renders upload photo button when no avatar', () => {
    currentProfile = { name: 'Test User', bio: 'Hello', avatar: '', fields: [] };
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getByText('settings.editProfile'));
    expect(screen.getByText('settings.uploadPhoto')).toBeInTheDocument();
  });

  it('renders change and remove photo buttons when avatar exists', () => {
    currentProfile = { name: 'Test User', bio: 'Hello', avatar: 'data:image/png;base64,abc', fields: [] };
    render(<MyProfileSection onBack={vi.fn()} t={(k: string) => k} />);
    fireEvent.click(screen.getByText('settings.editProfile'));
    expect(screen.getByText('settings.changePhoto')).toBeInTheDocument();
    expect(screen.getByText('settings.removePhoto')).toBeInTheDocument();
  });
});
