import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders the input field', () => {
    render(<SearchBar searchQuery="" showSearch={true} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders with default searchQuery', () => {
    const { container } = render(<SearchBar searchQuery="default" showSearch={true} />);
    const input = container.querySelector('input');
    expect(input?.value).toBe('default');
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar searchQuery="" placeholder="Test placeholder" showSearch={true} />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Test placeholder');
  });

  it('does not render when showSearch is false', () => {
    const { container } = render(<SearchBar searchQuery="" showSearch={false} />);
    expect(container.querySelector('input')).not.toBeInTheDocument();
  });

  it('renders when showSearch is true', () => {
    render(<SearchBar searchQuery="" showSearch={true} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders when isDark is true', () => {
    render(<SearchBar searchQuery="" isDark={true} showSearch={true} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders when isDark is false', () => {
    render(<SearchBar searchQuery="" isDark={false} showSearch={true} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });
});
