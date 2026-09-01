import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallTopBar } from './CallTopBar';

const t = (key: string) => key;

const makeProps = () => ({
  showControls: true,
  remoteName: 'Alice',
  isGroup: false,
  participantCount: 0,
  statusLabel: 'Connecting...',
  elapsed: 0,
  status: 'connecting',
  latencyMs: 100,
  isPreview: false,
  isRecording: false,
  t,
  isVideo: false,
  isFullscreen: false,
  toggleFullscreen: vi.fn(),
  onMinimize: undefined as (() => void) | undefined,
});

describe('CallTopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when controls are hidden', () => {
    const { container } = render(<CallTopBar {...makeProps()} showControls={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders remote name and status label', () => {
    render(<CallTopBar {...makeProps()} />);
    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows group participant badge for group calls', () => {
    render(
      <CallTopBar {...makeProps()} isGroup participantCount={3} />,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows demo badge for preview calls', () => {
    render(<CallTopBar {...makeProps()} isPreview />);
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('formats elapsed time for connected calls (mm:ss and h:mm:ss)', () => {
    const { rerender } = render(
      <CallTopBar {...makeProps()} status="connected" statusLabel="Connected" elapsed={65} />,
    );
    expect(screen.getByText('01:05')).toBeInTheDocument();
    rerender(<CallTopBar {...makeProps()} status="connected" statusLabel="Connected" elapsed={3671} />);
    expect(screen.getByText('01:01:11')).toBeInTheDocument();
  });

  it('shows connecting dots for connecting and reconnecting status', () => {
    const { container, rerender } = render(<CallTopBar {...makeProps()} status="connecting" />);
    expect(container.querySelectorAll('.w-1.h-1')).toHaveLength(3);
    rerender(<CallTopBar {...makeProps()} status="reconnecting" />);
    expect(container.querySelectorAll('.w-1.h-1')).toHaveLength(3);
  });

  it('shows recording indicator when recording', () => {
    render(<CallTopBar {...makeProps()} isRecording />);
    expect(screen.getByText('call.recording')).toBeInTheDocument();
  });

  it('renders network quality bars with per-level labels', () => {
    const { rerender } = render(<CallTopBar {...makeProps()} latencyMs={100} />);
    expect(screen.getByTitle('call.networkQualityGood')).toBeInTheDocument();
    rerender(<CallTopBar {...makeProps()} latencyMs={200} />);
    expect(screen.getByTitle('call.networkQualityFair')).toBeInTheDocument();
    rerender(<CallTopBar {...makeProps()} latencyMs={500} />);
    expect(screen.getByTitle('call.networkQualityPoor')).toBeInTheDocument();
  });

  it('renders fullscreen button for video calls and fires toggleFullscreen', () => {
    const props = makeProps();
    render(<CallTopBar {...props} isVideo />);
    fireEvent.click(screen.getByRole('button', { name: 'call.fullscreen' }));
    expect(props.toggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('hides fullscreen button for audio calls', () => {
    render(<CallTopBar {...makeProps()} />);
    expect(screen.queryByRole('button', { name: 'call.fullscreen' })).not.toBeInTheDocument();
  });

  it('renders minimize button only when handler provided and fires it', () => {
    const onMinimize = vi.fn();
    render(<CallTopBar {...makeProps()} onMinimize={onMinimize} />);
    fireEvent.click(screen.getByRole('button', { name: 'call.minimize' }));
    expect(onMinimize).toHaveBeenCalledTimes(1);
  });
});
