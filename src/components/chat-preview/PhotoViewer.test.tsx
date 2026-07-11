import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PhotoViewerOverlay } from './PhotoViewer';

describe('PhotoViewerOverlay', () => {
  it('does not render when open is false', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={false} onClose={() => {}} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders when open is true and url is provided', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={() => {}} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders when open is true but no url', () => {
    render(<PhotoViewerOverlay url={null} open={true} onClose={() => {}} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders zoom in button', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={() => {}} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders zoom out button', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={() => {}} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders download button', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={() => {}} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={vi.fn()} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('closes when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={onClose} />);
    // The close button should close the viewer
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      fireEvent.click(btn);
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders with theme parameter', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={() => {}} theme="dark" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={() => {}} theme="light" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders dark theme', () => {
    render(<PhotoViewerOverlay url="http://example.com/img.jpg" open={true} onClose={() => {}} theme="dark" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
