import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MediaViewer } from './MediaViewer';

function renderViewer(props: Partial<Parameters<typeof MediaViewer>[0]> = {}) {
  return render(
    <MediaViewer media={{ type: 'photo', url: 'https://example.com/a.jpg', name: 'a.jpg' }} onClose={vi.fn()} {...props} />,
  );
}

describe('MediaViewer - interactive gallery (UI/UX plan §13)', () => {
  it('renders position counter when total is provided', () => {
    renderViewer({ total: 5, index: 2 });
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
  });

  it('hides counter for a single media', () => {
    renderViewer({ total: 1, index: 0 });
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  });

  it('swipes left to open next media', () => {
    const onNext = vi.fn();
    renderViewer({ onNext });
    const stage = document.querySelector('div[class*="fixed inset-0"]') as HTMLElement;
    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 100, clientY: 210 }] });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('swipes right to open previous media', () => {
    const onPrev = vi.fn();
    renderViewer({ onPrev });
    const stage = document.querySelector('div[class*="fixed inset-0"]') as HTMLElement;
    fireEvent.touchStart(stage, { touches: [{ clientX: 100, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 320, clientY: 205 }] });
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('ignores horizontal nav on vertical swipe (dismisses instead)', () => {
    const onNext = vi.fn();
    const onClose = vi.fn();
    renderViewer({ onNext, onClose });
    const stage = document.querySelector('div[class*="fixed inset-0"]') as HTMLElement;
    fireEvent.touchStart(stage, { touches: [{ clientX: 300, clientY: 200 }] });
    fireEvent.touchMove(stage, { touches: [{ clientX: 305, clientY: 430 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 305, clientY: 430 }] });
    expect(onNext).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('double-taps photo to zoom in and back', () => {
    renderViewer();
    const stage = document.querySelector('div[class*="fixed inset-0"]') as HTMLElement;
    fireEvent.touchStart(stage, { touches: [{ clientX: 150, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 150, clientY: 200 }] });
    fireEvent.touchStart(stage, { touches: [{ clientX: 160, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 160, clientY: 200 }] });
    expect(stage).toHaveAttribute('data-zoom', '2.5');
    fireEvent.touchStart(stage, { touches: [{ clientX: 150, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 150, clientY: 200 }] });
    fireEvent.touchStart(stage, { touches: [{ clientX: 160, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 160, clientY: 200 }] });
    expect(stage).toHaveAttribute('data-zoom', '1.0');
  });

  it('pinch-zooms photo from two-finger distance change', () => {
    renderViewer();
    const stage = document.querySelector('div[class*="fixed inset-0"]') as HTMLElement;
    fireEvent.touchStart(stage, {
      touches: [
        { clientX: 100, clientY: 200 },
        { clientX: 140, clientY: 200 },
      ],
    });
    fireEvent.touchMove(stage, {
      touches: [
        { clientX: 40, clientY: 200 },
        { clientX: 240, clientY: 200 },
      ],
    });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 40, clientY: 200 }] });
    expect(Number(stage.getAttribute('data-zoom'))).toBeGreaterThan(1);
  });

  it('resets zoom when switching media', () => {
    const { rerender } = renderViewer();
    const stage = document.querySelector('div[class*="fixed inset-0"]') as HTMLElement;
    fireEvent.touchStart(stage, { touches: [{ clientX: 150, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 150, clientY: 200 }] });
    fireEvent.touchStart(stage, { touches: [{ clientX: 160, clientY: 200 }] });
    fireEvent.touchEnd(stage, { changedTouches: [{ clientX: 160, clientY: 200 }] });
    expect(stage).toHaveAttribute('data-zoom', '2.5');
    rerender(
      <MediaViewer media={{ type: 'photo', url: 'https://example.com/b.jpg', name: 'b.jpg' }} onClose={vi.fn()} />,
    );
    const nextStage = document.querySelector('div[class*="fixed inset-0"]') as HTMLElement;
    expect(nextStage).toHaveAttribute('data-zoom', '1.0');
  });

  it('adds a seek control to video media after metadata loads', () => {
    renderViewer({ media: { type: 'video', url: 'https://example.com/v.mp4', name: 'v.mp4' } });
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    Object.defineProperty(video, 'duration', { value: 90, configurable: true });
    fireEvent(video, new Event('loadedmetadata'));
    const seek = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(seek).toBeInTheDocument();
    expect(Number(seek.max)).toBe(90);
  });

  it('reset-zoom button resets instead of zooming out (D4 nested-icon handler regression)', () => {
    renderViewer();
    const img = document.querySelector('img');
    const resetBtn = screen.getByRole('button', { name: 'media.resetZoom' });
    const nestedSvg = resetBtn.querySelector('svg');
    expect(nestedSvg).not.toBeNull();
    fireEvent.click(nestedSvg as Element);
    expect(img).not.toBeNull();
    expect(img!.style.transform || getComputedStyle(img!).transform).not.toContain('0.5');
  });

  it('keeps loaded photo visible when parent re-renders with a fresh media object (stale-key regression)', () => {
    const { rerender } = renderViewer();
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    fireEvent.load(img);
    expect(img).toHaveClass('opacity-100');
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    rerender(
      <MediaViewer media={{ type: 'photo', url: 'https://example.com/a.jpg', name: 'a.jpg' }} onClose={vi.fn()} />,
    );
    expect(document.querySelector('img')).toHaveClass('opacity-100');
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('shows error state for a photo without url instead of spinning forever', () => {
    renderViewer({ media: { type: 'photo' } });
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('hides Save/Forward/Delete when no message/callbacks (no dead controls)', () => {
    renderViewer();
    expect(screen.getByRole('button', { name: /media.share/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /media.download/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /media.save/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /media.forward/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /media.delete/ })).not.toBeInTheDocument();
  });

  it('shows Save/Forward/Delete and wires them when message + callbacks are provided', () => {
    const msg = { id: 7, fileName: 'photo', mime: 'image/png' };
    const onToggleSave = vi.fn();
    const onForward = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();
    renderViewer({ message: msg, onToggleSave, onForward, onDelete, onClose });

    fireEvent.click(screen.getByRole('button', { name: /media.save/ }));
    expect(onToggleSave).toHaveBeenCalledWith(msg);

    fireEvent.click(screen.getByRole('button', { name: /media.forward/ }));
    expect(onForward).toHaveBeenCalledWith(msg);
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /media.delete/ }));
    expect(onDelete).toHaveBeenCalledWith(msg);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('share without Web Share API falls back to download with extension (no .txt save)', async () => {
    const origShare = (navigator as any).share;
    const origCanShare = (navigator as any).canShare;
    const origClipboard = (navigator as any).clipboard;
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    let lastDownload: string | null = null;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      lastDownload = this.getAttribute('download') || (this as any).download;
    });
    try {
      renderViewer({ media: { type: 'photo', url: 'data:image/png;base64,AAAA' }, message: { fileName: 'photo', mime: 'image/png' } });
      fireEvent.click(screen.getByRole('button', { name: /media.share/ }));
      await vi.waitFor(() => expect(lastDownload).toBe('photo.png'));
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = origCreate;
      Object.defineProperty(navigator, 'share', { value: origShare, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: origCanShare, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: origClipboard, configurable: true });
    }
  });

  it('download appends extension from message mime (fixes .txt save)', async () => {
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    let blobMime: string | null = null;
    let lastDownload: string | null = null;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      lastDownload = this.getAttribute('download') || (this as any).download;
    });
    try {
      renderViewer({ media: { type: 'photo', url: 'data:image/png;base64,AAAA' }, message: { fileName: 'photo', mime: 'image/png' } });
      fireEvent.click(screen.getByRole('button', { name: /media.download/ }));
      await vi.waitFor(() => {
        expect(lastDownload).toBe('photo.png');
        const call = (URL.createObjectURL as any).mock.calls[0];
        blobMime = call && call[0] && call[0].type;
      });
      expect(blobMime).toBe('image/png');
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = origCreate;
    }
  });
});