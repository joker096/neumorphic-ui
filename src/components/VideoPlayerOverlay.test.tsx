import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoPlayerOverlay } from './VideoPlayerOverlay';

describe('VideoPlayerOverlay', () => {
  it('renders when open is true', () => {
    render(<VideoPlayerOverlay open={true} onClose={vi.fn()} />);
    expect(screen.getByText('media.player')).toBeTruthy();
  });

  it('does not render when open is false', () => {
    render(<VideoPlayerOverlay open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('media.player')).toBeNull();
  });

  it('renders play button', () => {
    render(<VideoPlayerOverlay open={true} onClose={vi.fn()} />);
    const playButton = document.querySelector('svg path');
    expect(playButton).toBeTruthy();
  });

  it('renders close button', () => {
    render(<VideoPlayerOverlay open={true} onClose={vi.fn()} />);
    expect(screen.getByText('media.player')).toBeTruthy();
    const closeSvg = document.querySelector('.lucide-x');
    expect(closeSvg).toBeTruthy();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<VideoPlayerOverlay open={true} onClose={onClose} />);
    const closeBtn = document.querySelector('.lucide-x')?.parentElement;
    if (closeBtn) fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders with light theme', () => {
    render(<VideoPlayerOverlay open={true} onClose={vi.fn()} theme="light" />);
    expect(screen.getByText('media.player')).toBeTruthy();
  });

  it('renders with dark theme', () => {
    render(<VideoPlayerOverlay open={true} onClose={vi.fn()} theme="dark" />);
    expect(screen.getByText('media.player')).toBeTruthy();
  });

  it('shows timestamps 0:42 and 2:30', () => {
    render(<VideoPlayerOverlay open={true} onClose={vi.fn()} />);
    expect(screen.getByText('0:42')).toBeTruthy();
    expect(screen.getByText('2:30')).toBeTruthy();
  });
});
