import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NavItem } from './UnifiedNav';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('NavItem - additional tests', () => {
  it('renders with icon component', () => {
    const MockIcon = () => <svg data-testid="nav-icon" />;
    const { container } = render(<NavItem label="Nav" icon={MockIcon as any} />);
    expect(container.querySelector('[data-testid="nav-icon"]') || container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders active state when isActive', () => {
    const { container } = render(<NavItem label="Active" isActive={true} />);
    expect(container.querySelector('[class*="bg-white/10"]') || container.querySelector('[class*="text-white"]')).toBeInTheDocument();
  });

  it('renders inactive state', () => {
    const { container } = render(<NavItem label="Inactive" />);
    expect(container.querySelector('[class*="text-gray-400"]') || container.querySelector('[class*="hover:text-white"]') || container.querySelector('[class*="group-hover:text-white"]')).toBeInTheDocument();
  });

  it('renders badge when provided', () => {
    render(<NavItem label="Chats" badge={5} badgeCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders without badge when not provided', () => {
    const { container } = render(<NavItem label="Chats" badge={undefined} badgeCount={undefined} />);
    expect(container.querySelector('button') || container.querySelector('.flex.items-center')).toBeInTheDocument();
  });

  it('renders with correct text size', () => {
    const { container } = render(<NavItem label="Nav" />);
    expect(container.querySelector('button').classList.contains('text-sm')).toBeTruthy();
  });

  it('renders with font medium', () => {
    const { container } = render(<NavItem label="Nav" />);
    expect(container.querySelector('button').classList.contains('font-medium')).toBeTruthy();
  });

  it('renders with rounded corners', () => {
    const { container } = render(<NavItem label="Nav" />);
    expect(container.querySelector('button').classList.contains('rounded-md')).toBeTruthy();
  });

  it('renders with gap-2', () => {
    const { container } = render(<NavItem label="Nav" />);
    expect(container.querySelector('button').classList.contains('gap-2')).toBeTruthy();
  });

  it('renders with cursor pointer', () => {
    const { container } = render(<NavItem label="Nav" />);
    expect(container.querySelector('button').classList.contains('cursor-pointer')).toBeTruthy();
  });

  it('renders with transition-all', () => {
    const { container } = render(<NavItem label="Nav" />);
    expect(container.querySelector('button').classList.contains('transition-all')).toBeTruthy();
  });

  it('renders with active style when active', () => {
    const { container } = render(<NavItem label="Active" active={true} />);
    expect(container.querySelector('button').classList.contains('bg-white/10')).toBeTruthy();
  });

  it('renders with hover style when inactive', () => {
    const { container } = render(<NavItem label="Inactive" active={false} />);
    expect(container.querySelector('button').classList.contains('hover:text-[var(--text-primary)]')).toBeTruthy();
  });
});
