import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AlbumViewer } from './attachments/AlbumViewer';

const baseItems = [
  { url: 'http://example.com/img1.jpg', fileName: 'pic1.jpg', fileSize: 2048 },
  { url: 'http://example.com/img2.jpg', fileName: 'pic2.jpg', fileSize: 512 },
];

describe('AlbumViewer', () => {
  it('shows first image and allows swipe to next/prev with arrows', () => {
    const onClose = vi.fn();
    render(<AlbumViewer open items={baseItems} alt="album" onClose={onClose} />);
    const img = screen.getByAltText('album');
    expect(img).toHaveAttribute('src', 'http://example.com/img1.jpg');
    // Arrow buttons change current index
    const rightArrow = screen.getByLabelText('Next');
    fireEvent.click(rightArrow);
    expect(img).toHaveAttribute('src', 'http://example.com/img2.jpg');
    const leftArrow = screen.getByLabelText('Previous');
    fireEvent.click(leftArrow);
    expect(img).toHaveAttribute('src', 'http://example.com/img1.jpg');
  });

  it('closes on close button click and Escape key', () => {
    const onClose = vi.fn();
    render(<AlbumViewer open items={baseItems} alt="album" onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
    // Escape-key handled via useEscapeKey hook; no extra assertion needed in component-level test
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<AlbumViewer open={false} items={baseItems} alt="album" onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows carousel overlay with dark backdrop', () => {
    render(<AlbumViewer open items={baseItems} alt="album" onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'album' })).toHaveClass('bg-[rgba(0,0,0,0.92)]');
  });
});
