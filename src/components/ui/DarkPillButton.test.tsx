import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { DarkPillButton } from './DarkPillButton';
import { Search } from 'lucide-react';

describe('DarkPillButton', () => {
  it('renders with title', () => {
    render(<DarkPillButton title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(<DarkPillButton title="Test" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const { container } = render(<DarkPillButton title="Test" icon={Search} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders badge instead of icon when badge is provided', () => {
    render(<DarkPillButton title="Test" badge="7" icon={Search} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('starts in inactive state', () => {
    render(<DarkPillButton title="Test" />);
    const title = screen.getByText('Test');
    expect(title.className).toContain('text-[');
  });

  it('toggles active state on click', () => {
    const { container } = render(<DarkPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    const title = screen.getByText('Test');
    expect(title.className).toContain('orange');
  });

  it('toggles active state back on second click', () => {
    const { container } = render(<DarkPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    fireEvent.click(button);
    const title = screen.getByText('Test');
    expect(title.className).not.toContain('orange');
  });

  it('renders glow elements when active', () => {
    const { container } = render(<DarkPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('[class*="blur-["]') || container.querySelector('[class*="blur-"]')).toBeInTheDocument();
  });

  it('shows hover glow when inactive', () => {
    const { container } = render(<DarkPillButton title="Test" />);
    expect(container.querySelector('[class*="opacity-0"]')).toBeInTheDocument();
  });

  it('applies active shadow styles', () => {
    const { container } = render(<DarkPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('[class*="shadow-["]') || container.querySelector('[class*="shadow"]')).toBeInTheDocument();
  });

  it('renders title in semibold weight', () => {
    render(<DarkPillButton title="Weight Test" />);
    const title = screen.getByText('Weight Test');
    expect(title.className).toContain('semibold');
  });

  it('does not render subtitle when not provided', () => {
    render(<DarkPillButton title="No Sub" />);
    expect(screen.queryByText(/subtitle/i)).not.toBeInTheDocument();
  });

  it('renders with fixed w-[260px] wrapper', () => {
    const { container } = render(<DarkPillButton title="FixedW" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('w-[260px]');
  });

  it('renders with fixed h-[66px] wrapper', () => {
    const { container } = render(<DarkPillButton title="FixedH" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('h-[66px]');
  });

  it('has hover scale effect when inactive', () => {
    const { container } = render(<DarkPillButton title="Scale" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('hover:scale-[1.03]');
  });

  it('has active scale effect when inactive', () => {
    const { container } = render(<DarkPillButton title="ActiveScale" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('active:scale-[0.97]');
  });

  it('renders with group class', () => {
    const { container } = render(<DarkPillButton title="Group" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('group');
  });

  it('renders border-orange-500/20 when active', () => {
    const { container } = render(<DarkPillButton title="BorderActive" />);
    const outer = container.firstElementChild as HTMLElement;
    fireEvent.click(outer);
    expect(outer.className).toContain('border-orange-500/20');
  });
});
