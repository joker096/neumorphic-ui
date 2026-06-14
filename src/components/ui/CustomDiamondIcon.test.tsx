import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CustomDiamondIcon } from './CustomDiamondIcon';

describe('CustomDiamondIcon', () => {
  it('renders an svg element', () => {
    const { container } = render(<CustomDiamondIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders three path elements', () => {
    const { container } = render(<CustomDiamondIcon />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(3);
  });

  it('forwards additional svg props', () => {
    const { container } = render(<CustomDiamondIcon className="custom-icon" data-testid="diamond" />);
    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('class')).toContain('custom-icon');
    expect(svg!.getAttribute('data-testid')).toBe('diamond');
  });

  it('has correct viewBox', () => {
    const { container } = render(<CustomDiamondIcon />);
    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('viewBox')).toBe('0 0 24 24');
  });
});
