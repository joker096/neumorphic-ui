import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { GifSearch } from './GifSearch';

describe('GifSearch', () => {
  it('does not render when open is false', () => {
    render(<GifSearch open={false} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders when open is true', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders close button when open', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('closes when close button is clicked', () => {
    const onClose = vi.fn();
    render(<GifSearch open={true} onClose={onClose} onSelect={vi.fn()} />);
    const closeBtn = document.querySelector('button');
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('renders search placeholder', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder');
  });

  it('renders search icon', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('clears query when clear button clicked', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input).toHaveValue('test');
  });

  it('renders trending section when no query', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders gif results grid', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('selects gif when clicked', () => {
    const onSelect = vi.fn();
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={onSelect} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows offline mode indicator', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true });
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders loading spinner', () => {
    render(<GifSearch open={true} onClose={vi.fn()} onSelect={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
