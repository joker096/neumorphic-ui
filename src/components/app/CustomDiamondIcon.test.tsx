import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { CustomDiamondIcon } from './CustomDiamondIcon';

describe('CustomDiamondIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<CustomDiamondIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with default size', () => {
    const { container } = render(<CustomDiamondIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders with custom size via props', () => {
    const { container } = render(<CustomDiamondIcon width={32} height={32} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});
