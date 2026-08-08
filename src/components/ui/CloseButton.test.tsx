import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CloseButton } from './CloseButton';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key === 'common.close' ? 'Close' : key, lang: 'en', setLang: vi.fn() }),
}));

const mockOnClick = vi.fn();

describe('CloseButton', () => {
  it('renders with default size', () => {
    render(<CloseButton onClick={mockOnClick} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders X icon', () => {
    const { container } = render(<CloseButton onClick={mockOnClick} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has min-w-[44px] min-h-[44px] touch zone', () => {
    const { container } = render(<CloseButton onClick={mockOnClick} />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('min-w-[44px]');
    expect(btn?.className).toContain('min-h-[44px]');
  });

  it('applies custom className', () => {
    const { container } = render(<CloseButton onClick={mockOnClick} className="custom" />);
    expect(container.querySelector('button')?.className).toContain('custom');
  });

  it('calls onClick on click', () => {
    const onClick = vi.fn();
    render(<CloseButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label', () => {
    render(<CloseButton onClick={mockOnClick} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Close');
  });

  it('renders with size sm', () => {
    const { container } = render(<CloseButton onClick={mockOnClick} size="sm" />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('14');
    expect(container.querySelector('svg')?.getAttribute('height')).toBe('14');
  });

  it('renders with size md (default)', () => {
    const { container } = render(<CloseButton onClick={mockOnClick} />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('16');
    expect(container.querySelector('svg')?.getAttribute('height')).toBe('16');
  });

  it('renders with size lg', () => {
    const { container } = render(<CloseButton onClick={mockOnClick} size="lg" />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('20');
    expect(container.querySelector('svg')?.getAttribute('height')).toBe('20');
  });

  it('renders type="button"', () => {
    const { container } = render(<CloseButton onClick={mockOnClick} />);
    expect(container.querySelector('button')).toHaveAttribute('type', 'button');
  });
});
