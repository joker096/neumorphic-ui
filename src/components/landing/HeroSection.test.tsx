import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', h1: 'h1', p: 'p', span: 'span' },
}));

vi.mock('lucide-react', () => ({ ArrowRight: 'div' }));

import { HeroSection } from './HeroSection';

describe('HeroSection', () => {
  it('renders version badge', () => {
    render(<HeroSection onGetStarted={vi.fn()} />);
    expect(screen.getByText(/v1.0/)).toBeInTheDocument();
  });

  it('renders headline', () => {
    render(<HeroSection onGetStarted={vi.fn()} />);
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Without Compromise')).toBeInTheDocument();
  });

  it('renders Open App button', () => {
    render(<HeroSection onGetStarted={vi.fn()} />);
    expect(screen.getByText('Open App')).toBeInTheDocument();
  });

  it('renders Source Code link', () => {
    render(<HeroSection onGetStarted={vi.fn()} />);
    expect(screen.getByText('Source Code')).toBeInTheDocument();
  });

  it('calls onGetStarted when button clicked', () => {
    const onGetStarted = vi.fn();
    render(<HeroSection onGetStarted={onGetStarted} />);
    fireEvent.click(screen.getByText('Open App'));
    expect(onGetStarted).toHaveBeenCalled();
  });
});
