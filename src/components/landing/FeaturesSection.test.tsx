import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, h3: 'h3', p: 'p' },
}));

import { FeaturesSection } from './FeaturesSection';

const mockFeatures = [
  { title: 'E2EE', desc: 'End-to-end encrypted', icon: () => null },
  { title: 'Mesh', desc: 'Mesh networking', icon: () => null },
];

describe('FeaturesSection', () => {
  it('renders feature cards', () => {
    render(<FeaturesSection features={mockFeatures} />);
    expect(screen.getByText('E2EE')).toBeInTheDocument();
    expect(screen.getByText('Mesh')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeaturesSection features={mockFeatures} />);
    expect(screen.getByText('End-to-end encrypted')).toBeInTheDocument();
    expect(screen.getByText('Mesh networking')).toBeInTheDocument();
  });

  it('renders empty when no features', () => {
    const { container } = render(<FeaturesSection features={[]} />);
    const grid = container.firstChild;
    expect(grid?.childNodes.length).toBe(0);
  });
});
