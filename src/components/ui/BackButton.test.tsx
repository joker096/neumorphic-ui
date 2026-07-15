import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BackButton } from './BackButton';

describe('BackButton - additional tests', () => {
  it('renders with text', () => {
    render(<BackButton label="Back" />);
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('renders with chevron icon', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with cursor pointer', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('cursor-pointer')).toBeTruthy();
  });

  it('renders with transition classes', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('transition-colors')).toBeTruthy();
  });

  it('renders with gap', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('gap-1.5')).toBeTruthy();
  });

  it('renders with text-sm', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('text-sm')).toBeTruthy();
  });

  it('renders with font-medium', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button').classList.contains('font-medium')).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<BackButton className="custom" />);
    expect(container.querySelector('button').classList.contains('custom')).toBeTruthy();
  });

  it('renders with onClick callback', () => {
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} label="Back" />);
    fireEvent.click(screen.getByText('Back'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders without onClick', () => {
    render(<BackButton label="Back" />);
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('renders with size sm', () => {
    const { container } = render(<BackButton size="sm" />);
    const wrapper = container.querySelector('button')?.querySelector('[class*="w-8"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders with size md by default', () => {
    const { container } = render(<BackButton />);
    const wrapper = container.querySelector('button')?.querySelector('[class*="w-9"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders with size lg', () => {
    const { container } = render(<BackButton size="lg" />);
    const wrapper = container.querySelector('button')?.querySelector('[class*="w-10"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders with type="button"', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button')).toHaveAttribute('type', 'button');
  });

  it('does not render label when not provided', () => {
    const { container } = render(<BackButton />);
    expect(container.querySelector('button')?.children.length).toBe(1);
  });

  it('renders with rounded-full icon wrapper', () => {
    const { container } = render(<BackButton />);
    const wrapper = container.querySelector('button')?.querySelector('[class*="rounded-full"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('has hover opacity transition', () => {
    const { container } = render(<BackButton />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('hover:opacity-80');
  });

  it('has active opacity transition', () => {
    const { container } = render(<BackButton />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('active:opacity-60');
  });

  it('renders ChevronLeft icon', () => {
    const { container } = render(<BackButton />);
    const chevron = container.querySelector('[class*="lucide-chevron"]') || container.querySelector('svg');
    expect(chevron).toBeInTheDocument();
  });
});
