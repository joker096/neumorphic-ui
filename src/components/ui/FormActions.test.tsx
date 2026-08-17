import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormActions } from './FormActions';

describe('FormActions', () => {
  it('renders submit button with custom label', () => {
    render(<FormActions submitLabel="Submit" />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('renders cancel button when onCancel is provided', () => {
    render(<FormActions submitLabel="Submit" onCancel={() => {}} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders cancel with custom label', () => {
    render(<FormActions submitLabel="Submit" cancelLabel="Nope" onCancel={() => {}} />);
    expect(screen.getByText('Nope')).toBeInTheDocument();
  });

  it('hides cancel button when onCancel is not provided', () => {
    render(<FormActions submitLabel="Submit" />);
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('calls onSubmit when submit button is clicked', () => {
    const onSubmit = vi.fn();
    render(<FormActions submitLabel="Submit" onSubmit={onSubmit} />);
    const submitBtn = document.querySelector('button:last-of-type')!;
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('does not call onSubmit when disabled', () => {
    const onSubmit = vi.fn();
    render(<FormActions submitLabel="Submit" disabled={true} onSubmit={onSubmit} />);
    const submitBtn = document.querySelector('button:last-of-type')!;
    fireEvent.click(submitBtn);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not call onSubmit when loading', () => {
    const onSubmit = vi.fn();
    render(<FormActions submitLabel="Submit" loading={true} onSubmit={onSubmit} />);
    const submitBtn = document.querySelector('button:last-of-type')!;
    fireEvent.click(submitBtn);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<FormActions submitLabel="Submit" onCancel={onCancel} />);
    const cancelBtn = document.querySelector('button:first-of-type')!;
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders loading spinner when loading', () => {
    render(<FormActions submitLabel="Submit" loading={true} />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('does not render loading spinner when not loading', () => {
    render(<FormActions submitLabel="Submit" loading={false} />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  it('renders disabled styling when disabled', () => {
    const { container } = render(<FormActions submitLabel="Submit" disabled={true} />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('opacity-50');
  });

  it('renders danger variant', () => {
    const { container } = render(<FormActions submitLabel="Delete" variant="danger" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('bg-red-500');
  });

  it('renders default variant', () => {
    const { container } = render(<FormActions submitLabel="Submit" variant="default" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('bg-gradient-to-r');
  });

  it('renders cancel button with dark theme styles', () => {
    const { container } = render(<FormActions submitLabel="Submit" onCancel={() => {}} />);
    const cancelBtn = container.querySelector('button:first-of-type')!;
    expect(cancelBtn?.className).toContain('bg-[var(--bg-tertiary)]');
  });

  it('renders cancel button with light theme styles', () => {
    const { container } = render(<FormActions submitLabel="Submit" theme="light" onCancel={() => {}} />);
    const cancelBtn = container.querySelector('button:first-of-type')!;
    expect(cancelBtn?.className).toContain('bg-[var(--bg-tertiary)]');
  });

  it('applies custom className', () => {
    const { container } = render(<FormActions submitLabel="Submit" className="custom-class" />);
    expect(container.firstElementChild).toHaveClass('custom-class');
  });

  it('renders cancel with default label', () => {
    render(<FormActions submitLabel="Submit" onCancel={() => {}} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('applies flex-1 to cancel button', () => {
    const { container } = render(<FormActions submitLabel="Submit" onCancel={() => {}} />);
    const cancelBtn = container.querySelector('button:first-of-type')!;
    expect(cancelBtn?.className).toContain('flex-1');
  });

  it('applies flex-1 to submit button', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('flex-1');
  });

  it('applies active:scale-95 on buttons', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const cancelBtn = container.querySelector('button:first-of-type')!;
    expect(cancelBtn?.className).toContain('active:scale-95');
  });

  it('renders with gap-3 between buttons', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    expect(container.firstElementChild).toHaveClass('gap-3');
  });

  it('renders with mt-4 margin top', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    expect(container.firstElementChild).toHaveClass('mt-4');
  });

  it('renders with font-bold', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('font-bold');
  });

  it('renders with h-12 height', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('h-12');
  });

  it('renders with rounded-xl border radius', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('rounded-xl');
  });

  it('renders with transition-all', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('transition-all');
  });

  it('renders with active:scale-95', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('active:scale-95');
  });

  it('renders with flex and items-center', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('flex');
    expect(submitBtn?.className).toContain('items-center');
  });

  it('renders with gap-2 on submit button', () => {
    const { container } = render(<FormActions submitLabel="Submit" />);
    const submitBtn = container.querySelector('button:last-of-type')!;
    expect(submitBtn?.className).toContain('gap-2');
  });
});