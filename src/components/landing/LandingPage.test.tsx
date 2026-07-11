import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', h2: 'h2', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('../../data/landingData', () => ({
  LANDING_FEATURES: [
    { title: 'E2EE', desc: 'End-to-end encrypted', icon: () => null },
    { title: 'Mesh', desc: 'Mesh networking', icon: () => null },
  ],
  SECURITY_ITEMS: [
    { title: 'Zero Trust', desc: 'Zero trust architecture', icon: () => null },
    { title: 'Onion Routing', desc: 'Onion routing', icon: () => null },
  ],
  easeOut: [0.32, 0.72, 0, 1],
}));

import { LandingPage } from './LandingPage';

describe('LandingPage', () => {
  it('renders HeroSection CTA button', () => {
    render(<LandingPage onGetStarted={vi.fn()} />);
    expect(screen.getByText('Open App')).toBeInTheDocument();
  });

  it('renders Features section title', () => {
    render(<LandingPage onGetStarted={vi.fn()} />);
    expect(screen.getByText(/private communication/)).toBeInTheDocument();
  });

  it('renders Security section', () => {
    render(<LandingPage onGetStarted={vi.fn()} />);
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    render(<LandingPage onGetStarted={vi.fn()} />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onGetStarted when Open App clicked', () => {
    const onGetStarted = vi.fn();
    render(<LandingPage onGetStarted={onGetStarted} />);
    fireEvent.click(screen.getByText('Open App'));
    expect(onGetStarted).toHaveBeenCalled();
  });
});
