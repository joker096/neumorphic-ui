import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials fallback based on name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders single character for single name', () => {
    render(<Avatar name="Bob" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('applies size class prop', () => {
    const { container } = render(<Avatar name="Test" size="lg" />);
    const inner = container.querySelector('.rounded-xl');
    expect(inner?.className).toContain('w-12');
    expect(inner?.className).toContain('h-12');
  });

  it('applies sm size correctly', () => {
    const { container } = render(<Avatar name="Test" size="sm" />);
    const inner = container.querySelector('.rounded-xl');
    expect(inner?.className).toContain('w-8');
    expect(inner?.className).toContain('h-8');
  });

  it('shows online status dot when online=true', () => {
    const { container } = render(<Avatar name="Test" online />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain('bg-green-400');
  });

  it('shows offline status dot when online=false', () => {
    const { container } = render(<Avatar name="Test" online={false} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot?.className).toContain('bg-[var(--text-tertiary)]');
  });

  it('does not render status dot when online prop is not provided', () => {
    const { container } = render(<Avatar name="Test" />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(0);
  });

  it('applies custom color gradient', () => {
    const { container } = render(<Avatar name="Test" color="from-purple-500 to-pink-500" />);
    const inner = container.querySelector('.rounded-xl');
    expect(inner?.className).toContain('from-purple-500');
    expect(inner?.className).toContain('to-pink-500');
  });

  it('applies className prop', () => {
    const { container } = render(<Avatar name="Test" className="extra-class" />);
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('extra-class');
  });
});
