import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Bell: 'div', Volume2: 'div', Moon: 'div', ChevronLeft: 'div', ChevronRight: 'div' }));

import { NotificationsSection } from './NotificationsSection';

describe('NotificationsSection', () => {
  const defaultProps = {
    isDark: false,
    onBack: vi.fn(),
    t: (k: string) => k,
    notificationsEnabled: true,
    setNotificationsEnabled: vi.fn(),
    soundEnabled: true,
    setSoundEnabled: vi.fn(),
    dndEnabled: false,
    setDndEnabled: vi.fn(),
    dndFrom: '22:00',
    setDndFrom: vi.fn(),
    dndTo: '08:00',
    setDndTo: vi.fn(),
  };

  it('renders notification section title', () => {
    render(<NotificationsSection {...defaultProps} />);
    expect(screen.getAllByText('settings.notificationsSection').length).toBeGreaterThanOrEqual(1);
  });

  it('renders notification toggle', () => {
    render(<NotificationsSection {...defaultProps} />);
    expect(screen.getByText('settings.notifications')).toBeInTheDocument();
  });

  it('renders sound option toggle', () => {
    render(<NotificationsSection {...defaultProps} />);
    expect(screen.getByText('settings.soundOption')).toBeInTheDocument();
  });

  it('does not show DND time inputs when disabled', () => {
    render(<NotificationsSection {...defaultProps} dndEnabled={false} />);
    expect(screen.queryByText('settings.dndFrom')).not.toBeInTheDocument();
  });

  it('shows DND time inputs when enabled', () => {
    render(<NotificationsSection {...defaultProps} dndEnabled={true} />);
    expect(screen.getByText('settings.dndFrom')).toBeInTheDocument();
    expect(screen.getByText('settings.dndTo')).toBeInTheDocument();
  });
});
