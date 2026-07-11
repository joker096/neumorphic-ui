import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, h2: 'h2', p: 'p', span: 'span' },
}));

vi.mock('lucide-react', () => ({ ArrowRight: 'div' }));

import { CTASection } from './CTASection';

describe('CTASection', () => {
  it('renders heading and description', () => {
    render(<CTASection onGetStarted={vi.fn()} />);
    expect(screen.getByText(/Ready to take control/)).toBeInTheDocument();
    expect(screen.getByText(/No signup required/)).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(<CTASection onGetStarted={vi.fn()} />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onGetStarted when button clicked', () => {
    const onGetStarted = vi.fn();
    render(<CTASection onGetStarted={onGetStarted} />);
    fireEvent.click(screen.getByText('Get Started'));
    expect(onGetStarted).toHaveBeenCalled();
  });
});
