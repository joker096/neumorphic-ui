import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallScreen } from './CallScreen';
import type { ActiveCall } from '../../lib/call/types';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      'call.unknownCaller': 'Unknown',
      'call.connecting': 'Connecting...',
      'call.recording': 'REC',
      'call.unmute': 'Unmute',
      'call.mute': 'Mute',
      'call.turnOffVideo': 'Turn off video',
      'call.turnOnVideo': 'Turn on video',
      'call.shareScreen': 'Share screen',
      'call.stopRecording': 'Stop recording',
      'call.record': 'Record',
      'call.switchToVideo': 'Switch to Video',
      'call.switchToAudio': 'Switch to Audio',
      'call.endCall': 'End call',
    }[key] ?? key),
  }),
}));

const mockAudioCall: ActiveCall = {
  callId: 'audio-1',
  direction: 'outgoing',
  status: 'connecting',
  callType: 'audio',
  remotePeer: { peerId: 'peer-1', displayName: 'Test' },
  localStream: null,
  screenStream: null,
  isMuted: false,
  isSpeaker: false,
  isVideoEnabled: false,
  isVideo: false,
  isRecording: false,
  startTime: Date.now(),
  participants: [],
};

const mockVideoCall: ActiveCall = {
  callId: 'video-1',
  direction: 'outgoing',
  status: 'connected',
  callType: 'video',
  remotePeer: { peerId: 'peer-2', displayName: 'Test' },
  localStream: null,
  screenStream: null,
  isMuted: false,
  isSpeaker: false,
  isVideoEnabled: true,
  isVideo: true,
  isRecording: true,
  startTime: Date.now(),
  participants: [],
};

describe('CallScreen - additional tests', () => {
  it('renders audio mode', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders video mode', () => {
    render(<CallScreen call={mockVideoCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders muted state', () => {
    render(<CallScreen call={{ ...mockAudioCall, isMuted: true }} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders unmuted state', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders video mode with local stream', () => {
    const { container } = render(<CallScreen call={mockVideoCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    const videos = container.querySelectorAll('video');
    expect(videos.length).toBeGreaterThan(0);
  });

  it('renders end call button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByTitle('End call')).toBeInTheDocument();
  });

  it('renders mute button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByTitle('Mute')).toBeInTheDocument();
  });

  it('renders video toggle when video mode', () => {
    render(<CallScreen call={mockVideoCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByTitle('Turn off video')).toBeInTheDocument();
  });

  it('renders screen share button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByTitle('Share screen')).toBeInTheDocument();
  });

  it('renders record button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByTitle('Record')).toBeInTheDocument();
  });

  it('renders call type switch button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByTitle('Switch to Video')).toBeInTheDocument();
  });

  it('renders initial avatar when no stream', () => {
    const { container } = render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(container.querySelector('[class*="neo-raised"]')).toBeInTheDocument();
  });

  it('renders status text', () => {
    render(<CallScreen call={{ ...mockAudioCall, status: 'ringing' }} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByText('ringing')).toBeInTheDocument();
  });

  it('renders recording indicator when recording', () => {
    render(<CallScreen call={mockVideoCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    expect(screen.getByText('REC')).toBeInTheDocument();
  });

  it('re-attaches the local stream to the PiP after a video toggle', () => {
    const stream = {} as MediaStream;
    const noop = () => {};
    const videoWithStream = (over: Partial<ActiveCall> = {}) => (
      <CallScreen
        call={{ ...mockVideoCall, localStream: stream, ...over }}
        onEnd={noop}
        toggleMute={noop}
        toggleVideo={noop}
        toggleScreenShare={noop}
        toggleRecording={noop}
        setActiveCall={noop}
      />
    );
    const { rerender, container } = render(videoWithStream());
    const pip = () => container.querySelector('.cursor-grab video') as HTMLVideoElement | null;
    expect(pip()?.srcObject).toBe(stream);

    rerender(videoWithStream({ callType: 'audio', isVideoEnabled: false, isVideo: false }));
    expect(pip()).toBeNull();

    rerender(videoWithStream());
    expect(pip()?.srcObject).toBe(stream);
  });

  it('renders neumorphic matte background for audio', () => {
    const { container } = render(<CallScreen call={mockAudioCall} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
    const root = container.querySelector('div[style*="radial-gradient"]');
    expect(root).toBeInTheDocument();
    expect(root?.getAttribute('style') ?? '').toContain('var(--bg-primary)');
  });
});
