import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));

vi.mock('lucide-react', () => ({
  Camera: 'div', Edit: 'div', Trash2: 'div', X: 'div', Check: 'div',
  User: 'div', Phone: 'div', Mail: 'div', MessageSquare: 'div',
  Send: 'div', Shield: 'div', AtSign: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector?.({
    userProfile: { name: 'Test User', bio: 'Hello', fields: [] },
    setUserProfile: vi.fn(),
  }),
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import { MyProfileSection } from './MyProfileSection';

describe('MyProfileSection', () => {
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
});
