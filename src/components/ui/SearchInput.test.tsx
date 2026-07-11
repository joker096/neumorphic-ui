import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput - additional tests', () => {
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
    expect(container.querySelector('[class*="lucide-search"]') || container.querySelector('[class*="text-tertiary"]') || container.querySelector('svg')).toBeInTheDocument();
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

  it('renders with gap between icon and input', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="gap-2"]')).toBeInTheDocument();
  });

  it('renders with rounded wrapper', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="rounded"]')).toBeInTheDocument();
  });

  it('renders with bg style', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="bg-secondary"]') || container.querySelector('[class*="search-bg"]')).toBeInTheDocument();
  });

  it('renders with outline-none input', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="outline-none"]')).toBeInTheDocument();
  });

  it('renders with text-sm input', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="text-sm"]')).toBeInTheDocument();
  });

  it('renders with flex-1 input', () => {
    const { container } = render(<SearchInput value="" onChange={() => {}} />);
    expect(container.querySelector('[class*="flex-1"]')).toBeInTheDocument();
  });
});
