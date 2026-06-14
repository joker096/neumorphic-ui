import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlowingKnobLine } from './GlowingKnobLine';

describe('GlowingKnobLine', () => {
  it('renders without count', () => {
    const { container } = render(<GlowingKnobLine />);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('renders count when provided', () => {
    render(<GlowingKnobLine count={5} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('does not render count span when count is 0 (falsy)', () => {
    const { container } = render(<GlowingKnobLine count={0} />);
    expect(container.querySelector('span')).toBeNull();
  });

  it('renders with different count values', () => {
    render(<GlowingKnobLine count={42} />);
    expect(screen.getByText('42')).toBeTruthy();
  });
});
