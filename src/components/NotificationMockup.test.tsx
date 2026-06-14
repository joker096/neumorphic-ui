import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationMockup } from './NotificationMockup';

describe('NotificationMockup', () => {
  it('renders with dark theme by default', () => {
    render(<NotificationMockup />);
    expect(screen.getByText('notifications.updateTitle')).toBeTruthy();
  });

  it('renders with dark theme explicitly', () => {
    render(<NotificationMockup theme="dark" />);
    expect(screen.getByText('notifications.updateTitle')).toBeTruthy();
  });

  it('renders with light theme', () => {
    render(<NotificationMockup theme="light" />);
    expect(screen.getByText('notifications.updateTitle')).toBeTruthy();
  });

  it('shows update description', () => {
    render(<NotificationMockup />);
    expect(screen.getByText('notifications.updateBody')).toBeTruthy();
  });

  it('renders close button', () => {
    render(<NotificationMockup />);
    const closeButton = document.querySelector('.rounded-full.bg-white\\/5');
    expect(closeButton).toBeTruthy();
  });
});
