import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('fires onChange when value changes', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('shows disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders with search variant', () => {
    const { container } = render(<Input variant="search" />);
    const input = container.querySelector('input');
    expect(input?.style.boxShadow).toBeTruthy();
  });

  it('renders with default variant by default', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('bg-[var(--input-bg)]');
  });

  it('resolves inputMode from type', () => {
    const { container } = render(<Input type="tel" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('inputMode', 'tel');
  });

  it('resolves inputMode for email type', () => {
    const { container } = render(<Input type="email" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('inputMode', 'email');
  });

  it('resolves inputMode for number type', () => {
    const { container } = render(<Input type="number" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('inputMode', 'numeric');
  });

  it('applies className prop', () => {
    const { container } = render(<Input className="extra-class" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('extra-class');
  });

  it('renders with autoComplete prop', () => {
    const { container } = render(<Input autoComplete="off" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });
});
