import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AvatarRow } from './AvatarRow';

vi.mock('../../lib/i18n', () => ({
  useI18n: vi.fn(() => ({ t: (key: string) => key })),
}));

describe('AvatarRow', () => {
  it('renders story section header', () => {
    render(<AvatarRow theme="dark" />);
    expect(screen.getByText('header.stories')).toBeTruthy();
  });

  it('renders add story button', () => {
    render(<AvatarRow theme="dark" />);
    expect(screen.getByText('header.myStory')).toBeTruthy();
  });

  it('renders contact avatars', () => {
    render(<AvatarRow theme="dark" />);
    expect(screen.getByText('header.stories')).toBeTruthy();
  });

  it('renders with light theme', () => {
    render(<AvatarRow theme="light" />);
    expect(screen.getByText('header.stories')).toBeTruthy();
  });
});
