import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PillButton } from './PillButton';

describe('PillButton', () => {
  it('renders label', () => {
    render(<PillButton label="Chats" />);
    expect(screen.getByText('Chats')).toBeTruthy();
  });

  it('renders subtitle when provided and not large', () => {
    render(<PillButton label="Chats" subtitle="2 unread" />);
    expect(screen.getByText('2 unread')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<PillButton label="Click" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click').closest('div')!);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders with light theme', () => {
    render(<PillButton label="Light" theme="light" />);
    expect(screen.getByText('Light')).toBeTruthy();
  });

  it('renders plus icon when rightIcon is plus', () => {
    const { container } = render(<PillButton label="Add" rightIcon="plus" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders dropdown indicator when hasDropdown is true', () => {
    const { container } = render(<PillButton label="Menu" hasDropdown />);
    const chevron = container.querySelector('.lucide-chevron-down');
    expect(chevron).toBeTruthy();
  });

  it('renders large variant', () => {
    render(<PillButton label="Large" isLarge />);
    expect(screen.getByText('Large')).toBeTruthy();
  });

  it('renders with active state', () => {
    render(<PillButton label="Active" active />);
    expect(screen.getByText('Active')).toBeTruthy();
  });
});
