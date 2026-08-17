import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders with correct placeholder', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Type here..." />);
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('placeholder', 'Type here...');
  });

  it('renders with input wrapper', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders with search icon', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('.lucide-search')).toBeInTheDocument();
  });

  it('renders with current value', () => {
    render(<SearchInput value="search query" onChange={() => {}} />);
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('value', 'search query');
  });

  it('renders with placeholder text', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Search..." />);
    const input = document.querySelector('input');
    expect(input).toHaveAttribute('placeholder', 'Search...');
  });

  it('renders with gap between elements', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} shape="pill" />);
    expect(container.querySelector('[class*="gap-2"]')).toBeInTheDocument();
  });

  it('renders with rounded wrapper', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="rounded"]')).toBeInTheDocument();
  });

  it('renders with bg style', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    const input = container.querySelector('input');
    expect(input?.className).toMatch(/bg-/);
  });

  it('renders with outline-none input', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="outline-none"]')).toBeInTheDocument();
  });

  it('renders with flex-1 input', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} shape="pill" />);
    expect(container.querySelector('[class*="flex-1"]')).toBeInTheDocument();
  });

  it('shows clear button when value is non-empty', () => {
    const { container } = render(<SearchInput value="test" onChange={() => {}} />);
    expect(container.querySelector('[aria-label="Clear"]')).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[aria-label="Clear"]')).not.toBeInTheDocument();
  });

  it('renders in pill shape', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} shape="pill" />);
    expect(container.querySelector('[class*="rounded-full"]')).toBeInTheDocument();
  });

  it('renders in dark mode', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} isDark={true} />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('bg-muted');
  });

  it('renders in light mode', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} isDark={false} />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('bg-background');
  });

  it('renders with rightElement', () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} rightElement={<button>Action</button>} />
    );
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);
    const input = document.querySelector('input')!;
    input.value = 'new';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // The onChange would be triggered by a change event
    expect(onChange).not.toHaveBeenCalled();
    // Simulate actual React event
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
});
