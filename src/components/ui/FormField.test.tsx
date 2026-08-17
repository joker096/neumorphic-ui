import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders with label', () => {
    render(<FormField label="Username" value="" onChange={() => {}} />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('hides label when not provided', () => {
    render(<FormField value="" onChange={() => {}} />);
    expect(screen.queryByText('Username')).not.toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<FormField value="" onChange={() => {}} placeholder="Enter text" />);
    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('renders with correct value', () => {
    render(<FormField value="test" onChange={() => {}} />);
    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('value', 'test');
  });

  it('renders with default type', () => {
    render(<FormField value="" onChange={() => {}} />);
    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders with email type', () => {
    render(<FormField value="" onChange={() => {}} type="email" />);
    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders with tel type', () => {
    render(<FormField value="" onChange={() => {}} type="tel" />);
    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('type', 'tel');
  });

  it('calls onChange with truncated value when maxLength set', () => {
    const onChange = vi.fn();
    render(<FormField value="" maxLength={5} onChange={onChange} />);
    const input = document.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'hello world' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onChange with full value when maxLength not set', () => {
    const onChange = vi.fn();
    render(<FormField value="" onChange={onChange} />);
    const input = document.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'hello world' } });
    expect(onChange).toHaveBeenCalledWith('hello world');
  });

  it('renders with error', () => {
    render(<FormField value="" onChange={() => {}} error="Invalid input" />);
    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });

  it('hides error when not provided', () => {
    render(<FormField value="" onChange={() => {}} />);
    expect(screen.queryByText('Invalid input')).not.toBeInTheDocument();
  });

  it('renders with dark theme by default', () => {
    const { container } = render(<FormField value="" onChange={() => {}} />);
    const input = container.querySelector('input')!;
    expect(input?.className).toContain('bg-input-bg');
  });

  it('renders in light theme', () => {
    const { container } = render(<FormField value="" onChange={() => {}} theme="light" />);
    const input = container.querySelector('input')!;
    expect(input?.className).toContain('bg-input-bg');
  });

  it('renders with custom className', () => {
    const { container } = render(<FormField value="" onChange={() => {}} className="custom-class" />);
    expect(container.firstElementChild).toHaveClass('custom-class');
  });

  it('renders with error styling', () => {
    const { container } = render(<FormField value="" onChange={() => {}} error="Error!" />);
    const input = container.querySelector('input')!;
    expect(input?.className).toContain('bg-input-bg');
  });

  it('renders with disabled state', () => {
    const { container } = render(<FormField value="" onChange={() => {}} disabled={true} />);
    const input = container.querySelector('input')!;
    expect(input).toBeDisabled();
  });

  it('renders with inputMode', () => {
    render(<FormField value="" onChange={() => {}} inputMode="email" />);
    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('inputmode', 'email');
  });

  it('renders with autoComplete', () => {
    render(<FormField value="" onChange={() => {}} autoComplete="email" />);
    const input = document.querySelector('input')!;
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('renders with required attribute', () => {
    render(<FormField value="" onChange={() => {}} required={true} />);
    const input = document.querySelector('input')!;
    expect(input).toBeRequired();
  });

  it('renders with monospace font', () => {
    const { container } = render(<FormField value="" onChange={() => {}} monospace={true} />);
    const input = container.querySelector('input')!;
    expect(input?.className).toContain('font-mono');
  });

  it('renders with maxLength constraint', () => {
    const onChange = vi.fn();
    render(<FormField value="" maxLength={10} onChange={onChange} />);
    const input = document.querySelector('input')!;
    fireEvent.change(input, { target: { value: '12345678901' } });
    expect(onChange).toHaveBeenCalledWith('1234567890');
  });

  it('renders with onKeyDown handler', () => {
    const onKeyDown = vi.fn();
    render(<FormField value="" onChange={() => {}} onKeyDown={onKeyDown} />);
    const input = document.querySelector('input')!;
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onKeyDown).toHaveBeenCalled();
  });

  it('renders with input base styling (borderless)', () => {
    const { container } = render(<FormField value="" onChange={() => {}} />);
    const input = container.querySelector('input')!;
    expect(input?.className).toContain('bg-input-bg');
    expect(input?.className).not.toContain('border');
  });

  it('renders with error styling (borderless)', () => {
    const { container } = render(<FormField value="" onChange={() => {}} error="Error" />);
    const input = container.querySelector('input')!;
    expect(input?.className).toContain('bg-input-bg');
    expect(input?.className).not.toContain('border');
  });

  it('renders with disabled cursor-not-allowed', () => {
    const { container } = render(<FormField value="" onChange={() => {}} disabled={true} />);
    const input = container.querySelector('input')!;
    expect(input?.className).toContain('cursor-not-allowed');
  });

  it('renders label with correct styling', () => {
    const { container } = render(<FormField label="Label" value="" onChange={() => {}} />);
    const label = container.querySelector('label');
    expect(label).toHaveClass('text-[11px]');
    expect(label).toHaveClass('font-bold');
  });

  it('renders label with uppercase tracking', () => {
    const { container } = render(<FormField label="Label" value="" onChange={() => {}} />);
    const label = container.querySelector('label');
    expect(label).toHaveClass('tracking-widest');
  });

  it('renders error with ml-1 margin', () => {
    const { container } = render(<FormField value="" onChange={() => {}} error="Error" />);
    const error = container.querySelector('span');
    expect(error).toHaveClass('text-[11px]');
    expect(error).toHaveClass('font-medium');
    expect(error).toHaveClass('text-destructive');
  });
});