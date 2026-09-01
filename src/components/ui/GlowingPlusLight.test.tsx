import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GlowingPlusLight } from './GlowingPlusLight';

describe('GlowingPlusLight', () => {
  it('renders correctly', () => {
    const { container } = render(<GlowingPlusLight />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders Plus icon from lucide-react', () => {
    const { container } = render(<GlowingPlusLight />);
    expect(container.querySelector('.lucide-plus')).toBeInTheDocument();
  });

  it('has a glow effect div', () => {
    const { container } = render(<GlowingPlusLight />);
    expect(container.querySelector('div.absolute.inset-0')).toBeInTheDocument();
  });

  it('renders at w-6 h-6', () => {
    const { container } = render(<GlowingPlusLight />);
    expect(container.querySelector('div.w-6.h-6')).toBeInTheDocument();
  });
});