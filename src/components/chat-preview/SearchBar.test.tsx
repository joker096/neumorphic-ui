import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  const base = {
    showSearch: true,
    searchQuery: '',
    onSearchChange: vi.fn(),
    searchTypeFilter: 'all' as const,
    onSearchTypeChange: vi.fn(),
  };

  it('renders nothing when search is hidden', () => {
    const { container } = render(<SearchBar {...base} showSearch={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the type filter chips', () => {
    render(<SearchBar {...base} />);
    expect(screen.getByText('chat.filters.all')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.media')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.files')).toBeInTheDocument();
    expect(screen.getByText('chat.filters.links')).toBeInTheDocument();
  });

  it('fires onSearchTypeChange when a chip is clicked', () => {
    render(<SearchBar {...base} />);
    fireEvent.click(screen.getByText('chat.filters.media'));
    expect(base.onSearchTypeChange).toHaveBeenCalledWith('media');
    fireEvent.click(screen.getByText('chat.filters.links'));
    expect(base.onSearchTypeChange).toHaveBeenCalledWith('links');
  });

  it('renders the search input', () => {
    render(<SearchBar {...base} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('has no date control unless a jump handler is given', () => {
    render(<SearchBar {...base} />);
    expect(screen.queryByLabelText('chat.jumpToDate')).not.toBeInTheDocument();
  });

  it('jumps to the picked day and ignores an empty value', () => {
    const onJumpToDate = vi.fn();
    render(<SearchBar {...base} onJumpToDate={onJumpToDate} />);
    const input = screen.getByLabelText('chat.jumpToDate');
    fireEvent.change(input, { target: { value: '' } });
    expect(onJumpToDate).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '2024-05-10' } });
    expect(onJumpToDate).toHaveBeenCalledWith('2024-05-10');
  });
});
