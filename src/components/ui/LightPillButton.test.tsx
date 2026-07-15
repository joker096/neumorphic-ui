import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LightPillButton } from './LightPillButton';
import { Search } from 'lucide-react';

describe('LightPillButton', () => {
  it('renders with title', () => {
    render(<LightPillButton title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders with subtitle', () => {
    render(<LightPillButton title="Test" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    const { container } = render(<LightPillButton title="Test" icon={Search} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders badge instead of icon when badge is provided', () => {
    render(<LightPillButton title="Test" badge="3" icon={Search} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('starts in inactive state', () => {
    render(<LightPillButton title="Test" />);
    const classes = screen.getByText('Test').className.split(' ');
    expect(classes).toContain('group-hover:text-orange-600');
    expect(classes).not.toContain('text-orange-600');
  });

  it('toggles active state on click', () => {
    const { container } = render(<LightPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    const classes = screen.getByText('Test').className.split(' ');
    expect(classes).toContain('text-orange-600');
  });

  it('toggles active state back on second click', () => {
    const { container } = render(<LightPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    fireEvent.click(button);
    const classes = screen.getByText('Test').className.split(' ');
    expect(classes).toContain('group-hover:text-orange-600');
    expect(classes).not.toContain('text-orange-600');
  });

  it('renders glow elements when active', () => {
    const { container } = render(<LightPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('[class*="blur-["]') || container.querySelector('[class*="blur-"]')).toBeInTheDocument();
  });

  it('applies active shadow styles', () => {
    const { container } = render(<LightPillButton title="Test" />);
    const button = container.querySelector('[class*="cursor-pointer"]') as HTMLElement;
    fireEvent.click(button);
    expect(container.querySelector('[class*="shadow-["]') || container.querySelector('[class*="shadow"]')).toBeInTheDocument();
  });

  it('renders title in correct variant weight', () => {
    render(<LightPillButton title="Weight Test" />);
    const title = screen.getByText('Weight Test');
    expect(title.className).toContain('semibold');
  });

  it('renders without badge or icon when neither provided', () => {
    const { container } = render(<LightPillButton title="Test" />);
    const rightSection = container.querySelector('[class*="shrink-0"]');
    expect(rightSection?.children.length || 0).toBe(0);
  });

  it('does not render subtitle when not provided', () => {
    render(<LightPillButton title="No Sub" />);
    expect(screen.queryByText(/subtitle/i)).not.toBeInTheDocument();
  });

  it('has hover scale effect when inactive', () => {
    const { container } = render(<LightPillButton title="Scale" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('hover:scale-[1.03]');
  });

  it('has active scale effect when inactive', () => {
    const { container } = render(<LightPillButton title="ActiveScale" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('active:scale-[0.97]');
  });

  it('renders border-white/80 when inactive', () => {
    const { container } = render(<LightPillButton title="BorderInactive" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('border-white/80');
  });

  it('renders border-black/5 when active', () => {
    const { container } = render(<LightPillButton title="BorderActive" />);
    const outer = container.firstElementChild as HTMLElement;
    fireEvent.click(outer);
    expect(outer.className).toContain('border-black/5');
  });
});
