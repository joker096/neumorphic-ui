import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FormSelect } from './FormSelect';

describe('FormSelect', () => {
  it('renders with options', () => {
    render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
        ]}
      />
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders with placeholder when provided', () => {
    render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
        placeholder="Select..."
      />
    );
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('hides placeholder when not provided', () => {
    render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    expect(screen.queryByText('Select...')).not.toBeInTheDocument();
  });

  it('renders with selected value', () => {
    render(
      <FormSelect
        value="1"
        onChange={() => {}}
        options={[
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
        ]}
      />
    );
    const select = document.querySelector('select')!;
    expect(select).toHaveValue('1');
  });

  it('calls onChange with selected value', () => {
    const onChange = vi.fn();
    render(
      <FormSelect
        value=""
        onChange={onChange}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = document.querySelector('select')!;
    fireEvent.change(select, { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('renders with dark theme by default', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('bg-[var(--bg-secondary)]');
    expect(select?.className).toContain('text-[var(--text-primary)]');
    expect(select?.className).toContain('border-[var(--border-color)]');
  });

  it('renders in light theme', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
        theme="light"
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('bg-slate-50');
    expect(select?.className).toContain('border-[var(--border-color)]');
  });

  it('renders with custom className', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
        className="custom-class"
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('custom-class');
  });

  it('renders placeholder as disabled option', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
        placeholder="Select..."
      />
    );
    const select = container.querySelector('select')!;
    const options = select.querySelectorAll('option');
    const firstOption = options[0];
    expect(firstOption).toHaveAttribute('disabled');
  });

  it('renders with white text in dark theme', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('text-[var(--text-primary)]');
  });

  it('renders with border in dark theme', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('border-[var(--border-color)]');
  });

  it('renders with border in light theme', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
        theme="light"
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('border-[var(--border-color)]');
  });

  it('renders with rounded-lg', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('rounded-lg');
  });

  it('renders with text-xs', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('text-xs');
  });

  it('renders with h-8 height', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('h-8');
  });

  it('renders with px-2 padding', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('px-2');
  });

  it('renders with outline-none', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('outline-none');
  });

  it('renders with w-full width', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
      />
    );
    const select = container.querySelector('select')!;
    expect(select?.className).toContain('w-full');
  });

  it('renders placeholder with default attribute', () => {
    const { container } = render(
      <FormSelect
        value=""
        onChange={() => {}}
        options={[{ value: '1', label: 'Option 1' }]}
        placeholder="Select..."
      />
    );
    const select = container.querySelector('select')!;
    const options = select.querySelectorAll('option');
    const placeholder = options[0];
    expect(placeholder).toHaveAttribute('disabled');
    expect(placeholder).toHaveValue('');
  });

  it('renders all options with correct values', () => {
    render(
      <FormSelect
        value="2"
        onChange={() => {}}
        options={[
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
          { value: '3', label: 'Option 3' },
        ]}
      />
    );
    const select = document.querySelector('select')!;
    const options = select.querySelectorAll('option');
    expect(options[0]).toHaveValue('1');
    expect(options[1]).toHaveValue('2');
    expect(options[2]).toHaveValue('3');
  });
});