import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  localStream: {} as MediaStream,
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
  localStream: {} as MediaStream,
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
    const { container } = render(<CallScreen call={{ ...mockAudioCall, localStream: null }} onEnd={() => {}} toggleMute={() => {}} toggleVideo={() => {}} toggleScreenShare={() => {}} toggleRecording={() => {}} setActiveCall={() => {}} />);
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

describe('CallScreen - speaker routing', () => {
  let setSinkId: ReturnType<typeof vi.fn>;

  const props = (isSpeaker: boolean) => ({
    call: { ...mockAudioCall, isSpeaker },
    onEnd: () => {},
    toggleMute: () => {},
    toggleVideo: () => {},
    toggleScreenShare: () => {},
    toggleRecording: () => {},
    setActiveCall: () => {},
  });

  beforeEach(() => {
    setSinkId = vi.fn().mockResolvedValue(undefined);
    (HTMLMediaElement.prototype as any).setSinkId = setSinkId;
  });

  afterEach(() => {
    delete (HTMLMediaElement.prototype as any).setSinkId;
    delete (window.navigator as any).mediaDevices;
  });

  const stubDevices = (labels: Array<[string, string]>) => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: vi.fn().mockResolvedValue(
          labels.map(([deviceId, label]) => ({ deviceId, kind: 'audiooutput', label, groupId: '' })),
        ),
      },
    });
  };

  it('routes remote audio to the default output while speaker is off', async () => {
    render(<CallScreen {...props(false)} />);
    await waitFor(() => expect(setSinkId).toHaveBeenLastCalledWith('default'));
  });

  it('routes remote audio to the speaker output when speaker is on', async () => {
    stubDevices([
      ['default', 'Default'],
      ['spk-1', 'Speaker'],
    ]);
    const { rerender } = render(<CallScreen {...props(false)} />);
    await waitFor(() => expect(setSinkId).toHaveBeenLastCalledWith('default'));
    rerender(<CallScreen {...props(true)} />);
    await waitFor(() => expect(setSinkId).toHaveBeenLastCalledWith('spk-1'));
  });

  it('falls back to the default output when no speaker device is labelled', async () => {
    stubDevices([
      ['default', ''],
      ['rec-1', ''],
    ]);
    render(<CallScreen {...props(true)} />);
    await waitFor(() => expect(setSinkId).toHaveBeenLastCalledWith('default'));
  });

  it('re-routes audio when the device set changes mid-call', async () => {
    const listeners = new Map<string, () => void>();
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { deviceId: 'default', kind: 'audiooutput', label: 'Default', groupId: '' },
          { deviceId: 'spk-1', kind: 'audiooutput', label: 'Speaker', groupId: '' },
        ]),
        addEventListener: vi.fn().mockImplementation((type: string, cb: () => void) => {
          listeners.set(type, cb);
        }),
        removeEventListener: vi.fn().mockImplementation((type: string) => {
          listeners.delete(type);
        }),
      },
    });
    const { rerender } = render(<CallScreen {...props(false)} />);
    await waitFor(() => expect(setSinkId).toHaveBeenLastCalledWith('default'));
    rerender(<CallScreen {...props(true)} />);
    await waitFor(() => expect(setSinkId).toHaveBeenLastCalledWith('spk-1'));

    setSinkId.mockClear();
    listeners.get('devicechange')?.();
    await waitFor(() => expect(setSinkId).toHaveBeenLastCalledWith('spk-1'));
  });
});
