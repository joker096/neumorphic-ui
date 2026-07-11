import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, h3: 'h3', p: 'p' },
}));

import { SecuritySection } from './SecuritySection';

const mockItems = [
  { title: 'Zero Trust', desc: 'Zero trust architecture', icon: () => null },
  { title: 'Onion Routing', desc: 'Onion routing protocol', icon: () => null },
];

describe('SecuritySection', () => {
  it('renders security items', () => {
    render(<SecuritySection items={mockItems} />);
    expect(screen.getByText('Zero Trust')).toBeInTheDocument();
    expect(screen.getByText('Onion Routing')).toBeInTheDocument();
  });

  it('renders item descriptions', () => {
    render(<SecuritySection items={mockItems} />);
    expect(screen.getByText('Zero trust architecture')).toBeInTheDocument();
    expect(screen.getByText('Onion routing protocol')).toBeInTheDocument();
  });

  it('renders empty when no items', () => {
    const { container } = render(<SecuritySection items={[]} />);
    const grid = container.firstChild;
    expect(grid?.childNodes.length).toBe(0);
  });
});
