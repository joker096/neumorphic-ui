import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Zap: 'div' }));

import { LandingFooter } from './LandingFooter';

describe('LandingFooter', () => {
  it('renders brand name', () => {
    render(<LandingFooter />);
    expect(screen.getByText('Mess&Anger')).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    render(<LandingFooter />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Open source/)).toBeInTheDocument();
  });
});
