import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('lucide-react', () => ({ X: 'div' }));

import { VideoOverlay } from './VideoOverlay';

const mockVideoRef = { current: null };

describe('VideoOverlay', () => {
  it('renders nothing when showVideo is false', () => {
    const { container } = render(
      <VideoOverlay showVideo={false} videoUrl="test.mp4" videoRef={mockVideoRef as any} closeVideo={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when videoUrl is null', () => {
    const { container } = render(
      <VideoOverlay showVideo={true} videoUrl={null} videoRef={mockVideoRef as any} closeVideo={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders video element when visible', () => {
    render(
      <VideoOverlay showVideo={true} videoUrl="test.mp4" videoRef={mockVideoRef as any} closeVideo={vi.fn()} />
    );
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'test.mp4');
  });

  it('renders close button', () => {
    render(
      <VideoOverlay showVideo={true} videoUrl="test.mp4" videoRef={mockVideoRef as any} closeVideo={vi.fn()} />
    );
    const closeBtn = screen.getByRole('button');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls closeVideo when close button clicked', () => {
    const closeVideo = vi.fn();
    render(
      <VideoOverlay showVideo={true} videoUrl="test.mp4" videoRef={mockVideoRef as any} closeVideo={closeVideo} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(closeVideo).toHaveBeenCalled();
  });
});
