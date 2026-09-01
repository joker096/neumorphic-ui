import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallControlBar } from './CallControlBar';

const t = (key: string) => key;

const baseCall = {
  callType: 'audio',
  isMuted: false,
  isVideoEnabled: true,
  isSpeaker: false,
  screenStream: null,
  isRecording: false,
  localStream: null,
  isPreview: false,
};

const makeProps = () => ({
  showControls: true,
  call: baseCall,
  t,
  toggleMute: vi.fn(),
  toggleVideo: vi.fn(),
  toggleSpeaker: vi.fn(),
  toggleScreenShare: vi.fn(),
  toggleRecording: vi.fn(),
  onFlipCamera: vi.fn(),
  onChangeCallType: vi.fn(),
  onEnd: vi.fn(),
});

describe('CallControlBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when controls are hidden', () => {
    const { container } = render(<CallControlBar {...makeProps()} showControls={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders audio call controls', () => {
    render(<CallControlBar {...makeProps()} />);
    expect(screen.getByRole('button', { name: 'call.mute' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'call.turnOffVideo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'call.shareScreen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'call.record' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'call.switchToVideo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'call.endCall' })).toBeInTheDocument();
  });

  it('shows muted and recording states on the buttons', () => {
    const props = makeProps();
    render(
      <CallControlBar
        {...props}
        call={{ ...baseCall, isMuted: true, isRecording: true }}
      />,
    );
    expect(screen.getByRole('button', { name: 'call.unmute' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'call.stopRecording' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('wires each control to its callback', () => {
    const props = makeProps();
    render(<CallControlBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'call.mute' }));
    expect(props.toggleMute).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'call.turnOffVideo' }));
    expect(props.toggleVideo).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'call.shareScreen' }));
    expect(props.toggleScreenShare).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'call.record' }));
    expect(props.toggleRecording).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'call.endCall' }));
    expect(props.onEnd).toHaveBeenCalledTimes(1);
  });

  it('switches call type between audio and video', () => {
    const props = makeProps();
    render(<CallControlBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'call.switchToVideo' }));
    expect(props.onChangeCallType).toHaveBeenCalledWith('video');

    const videoProps = makeProps();
    const { unmount } = render(<CallControlBar {...videoProps} call={{ ...baseCall, callType: 'video' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'call.switchToAudio' }));
    expect(videoProps.onChangeCallType).toHaveBeenCalledWith('audio');
    unmount();
  });

  it('shows flip camera only for a live video call with handler', () => {
    const flipCall = { ...baseCall, callType: 'video', localStream: {} };
    const props = makeProps();
    render(<CallControlBar {...props} call={flipCall} />);
    expect(screen.getByRole('button', { name: 'call.flipCamera' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'call.flipCamera' }));
    expect(props.onFlipCamera).toHaveBeenCalledTimes(1);
  });

  it('hides flip camera for audio, preview, or missing handler', () => {
    const { unmount } = render(
      <CallControlBar {...makeProps()} call={{ ...baseCall, callType: 'video', localStream: {} }} />,
    );
    expect(screen.getByRole('button', { name: 'call.flipCamera' })).toBeInTheDocument();
    unmount();

    render(<CallControlBar {...makeProps()} call={{ ...baseCall, callType: 'video', localStream: null }} />);
    expect(screen.queryByRole('button', { name: 'call.flipCamera' })).not.toBeInTheDocument();
  });

  it('hides flip camera for preview calls', () => {
    render(
      <CallControlBar
        {...makeProps()}
        call={{ ...baseCall, callType: 'video', localStream: {}, isPreview: true }}
      />,
    );
    expect(screen.queryByRole('button', { name: 'call.flipCamera' })).not.toBeInTheDocument();
  });

  it('shows speaker toggle only when handler provided and tracks active state', () => {
    const props = makeProps();
    render(<CallControlBar {...props} />);
    expect(screen.getByRole('button', { name: 'call.speakerOff' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'call.speakerOff' }));
    expect(props.toggleSpeaker).toHaveBeenCalledTimes(1);
  });

  it('hides speaker toggle when no handler', () => {
    const props = makeProps();
    render(<CallControlBar {...props} toggleSpeaker={undefined} />);
    expect(screen.queryByRole('button', { name: 'call.speakerOff' })).not.toBeInTheDocument();
  });

  it('marks screen share active when a screen stream is present', () => {
    render(
      <CallControlBar {...makeProps()} call={{ ...baseCall, screenStream: {} }} />,
    );
    expect(screen.getByRole('button', { name: 'call.shareScreen' })).toHaveAttribute('aria-pressed', 'true');
  });
});
