import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GlowingPlusLight } from './GlowingPlusLight';

describe('GlowingPlusLight', () => {
  it('renders without crashing', () => {
    const { container } = render(<GlowingPlusLight />);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('renders a Plus icon (svg)', () => {
    const { container } = render(<GlowingPlusLight />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('has glow effect div', () => {
    const { container } = render(<GlowingPlusLight />);
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBeGreaterThanOrEqual(2);
  });
});
