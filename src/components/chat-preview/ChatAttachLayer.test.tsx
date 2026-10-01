import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatAttachLayer } from './ChatAttachLayer';

// Keys only: fallbacks are ignored so assertions cannot silently pass on a
// translated string and hide a wrong-key bug.
const t = (k: string) => k;

const baseProps = () => ({
  isDark: true,
  open: true,
  onClose: vi.fn(),
  onOpenVideoRecorder: vi.fn(),
  mediaInputRef: { current: null },
  docInputRef: { current: null },
  audioInputRef: { current: null },
  t,
});

describe('ChatAttachLayer (live location consent)', () => {
  beforeEach(() => vi.clearAllMocks());

  const openRow = (label: string) => fireEvent.click(screen.getByText(label));

  it('routes the live row through a consent sheet instead of starting immediately', () => {
    const start = vi.fn();
    render(<ChatAttachLayer {...baseProps()} startLiveLocationShare={start} />);

    openRow('chat.liveLocation');

    // No share may begin before duration and precision are chosen.
    expect(start).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('starts the share with the chosen duration and precision', () => {
    const start = vi.fn();
    render(<ChatAttachLayer {...baseProps()} startLiveLocationShare={start} />);

    openRow('chat.liveLocation');
    fireEvent.click(screen.getByText('chat.liveFor15m'));
    // Default is approximate; unchecking it is an explicit precision choice.
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('chat.shareLiveLocation'));

    expect(start).toHaveBeenCalledWith({ durationMs: 15 * 60_000, approximate: false });
  });

  it('cancels without starting when consent is dismissed', () => {
    const start = vi.fn();
    render(<ChatAttachLayer {...baseProps()} startLiveLocationShare={start} />);

    openRow('chat.liveLocation');
    fireEvent.click(screen.getByText('chat.cancel'));

    expect(start).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('turns the same row into a stop control while sharing', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const onClose = vi.fn();
    render(
      <ChatAttachLayer
        {...baseProps()}
        onClose={onClose}
        isSharingLiveLocation
        startLiveLocationShare={start}
        stopLiveLocationShare={stop}
      />,
    );

    // The stop path must not be gated behind a consent sheet.
    expect(screen.queryByRole('dialog')).toBeNull();
    openRow('chat.stopLiveLocation');

    expect(stop).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
    expect(start).not.toHaveBeenCalled();
  });
});
