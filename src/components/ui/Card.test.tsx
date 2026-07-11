import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><span>Content</span></Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('custom-class');
  });

  it('renders with raised variant by default', () => {
    const { container } = render(<Card>Content</Card>);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('shadow-[var(--shadow-neu-raised)]');
  });

  it('renders with elevated variant', () => {
    const { container } = render(<Card variant="raised">Content</Card>);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('shadow-[var(--shadow-neu-raised)]');
  });

  it('renders with outlined variant', () => {
    const { container } = render(<Card variant="inset">Content</Card>);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('shadow-[var(--shadow-neu-inset)]');
  });

  it('renders with flat variant', () => {
    const { container } = render(<Card variant="flat">Content</Card>);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('bg-[var(--card-flat-bg)]');
    expect(outer?.className).not.toContain('shadow-[');
  });

  it('renders with glass variant', () => {
    const { container } = render(<Card variant="glass">Content</Card>);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('bg-[var(--glass-bg)]');
    expect(outer?.className).toContain('border');
  });

  it('renders with double-bezel variant structure', () => {
    const { container } = render(<Card variant="double-bezel">Content</Card>);
    expect(container.firstElementChild?.className).not.toContain('shadow-[');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies size sm padding', () => {
    const { container } = render(<Card size="sm">Content</Card>);
    const inner = container.querySelector('.transition-all');
    expect(inner?.className).toContain('p-3');
  });

  it('applies size lg padding', () => {
    const { container } = render(<Card size="lg">Content</Card>);
    const inner = container.querySelector('.transition-all');
    expect(inner?.className).toContain('p-6');
  });
});
