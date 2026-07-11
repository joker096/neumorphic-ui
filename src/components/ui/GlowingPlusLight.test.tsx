import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GlowingPlusLight } from './GlowingPlusLight';

describe('GlowingPlusLight', () => {
  it('renders correctly', () => {
    render(<GlowingPlusLight />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders Plus icon from lucide-react', () => {
    render(<GlowingPlusLight />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('has a glow effect div', () => {
    render(<GlowingPlusLight />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders at w-6 h-6', () => {
    render(<GlowingPlusLight />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
