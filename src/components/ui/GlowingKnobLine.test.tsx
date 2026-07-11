import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GlowingKnobLine } from './GlowingKnobLine';

function getKnob(count?: number) {
  const { container } = render(<GlowingKnobLine count={count} />);
  return container.firstElementChild as HTMLElement;
}

describe('GlowingKnobLine', () => {
  it('renders correctly', () => {
    expect(getKnob()).toBeInTheDocument();
  });

  it('shows count when provided', () => {
    render(<GlowingKnobLine count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show count when not provided', () => {
    render(<GlowingKnobLine />);
    expect(screen.queryByText(/^[0-9]+$/)).not.toBeInTheDocument();
  });

  it('has w-[20px] h-[20px]', () => {
    const el = getKnob();
    expect(el).toHaveAttribute('class', expect.stringContaining('w-[20px]'));
    expect(el).toHaveAttribute('class', expect.stringContaining('h-[20px]'));
  });

  it('has gradient background', () => {
    render(<GlowingKnobLine />);
    const container = document.querySelector('.absolute');
    expect(container).toHaveAttribute('class', expect.stringContaining('bg-gradient-to-tr'));
  });

  it('renders with count of 0', () => {
    render(<GlowingKnobLine count={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with count of 100', () => {
    render(<GlowingKnobLine count={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
