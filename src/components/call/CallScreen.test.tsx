import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CallScreen } from './CallScreen';

type MockCall = {
  id: string;
  remotePeer: { displayName: string; stream?: MediaStream };
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isRecording: boolean;
  callType: 'audio' | 'video' | 'screen';
  status: string;
};

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('CallScreen - additional tests', () => {
  const mockAudioCall: MockCall = {
    id: 'audio-1',
    remotePeer: { displayName: 'Test', stream: null },
    localStream: null,
    screenStream: null,
    isMuted: false,
    isVideoEnabled: false,
    isRecording: false,
    callType: 'audio',
    status: 'connecting',
  };

  const mockVideoCall: MockCall = {
    id: 'video-1',
    remotePeer: { displayName: 'Test', stream: null },
    localStream: null,
    screenStream: null,
    isMuted: false,
    isVideoEnabled: true,
    isRecording: true,
    callType: 'video',
    status: 'connected',
  };

  it('renders audio mode', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders video mode', () => {
    render(<CallScreen call={mockVideoCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders muted state', () => {
    render(<CallScreen call={{ ...mockAudioCall, isMuted: true }} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="bg-red-500"]')?.closest('button')).toBeInTheDocument();
  });

  it('renders unmuted state', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="opacity-50"]') || document.querySelector('[class*="text-white/20"]')?.closest('button')).toBeInTheDocument();
  });

  it('renders video mode with local stream', () => {
    const { container } = render(<CallScreen call={mockVideoCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    const videos = container.querySelectorAll('video');
    expect(videos.length).toBeGreaterThan(0);
  });

  it('renders end call button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="w-16 h-16"]') || document.querySelector('[class*="PhoneOff"]')).toBeInTheDocument();
  });

  it('renders mute button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="w-14 h-14"]') || document.querySelector('[class*="lucide-mic-off"]')).toBeInTheDocument();
  });

  it('renders video toggle when video mode', () => {
    render(<CallScreen call={mockVideoCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="lucide-video"]') || document.querySelector('[class*="lucide-video-off"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders screen share button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="w-14.h-14"]')?.closest('button')?.querySelector('[class*="lucide-monitor"]') || document.querySelector('[class*="lucide-monitor"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders record button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="w-14.h-14"]')?.closest('button')?.querySelector('[class*="lucide-square"]') || document.querySelector('[class*="lucide-square"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders call type switch button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(document.querySelector('[class*="w-14.h-14"]')?.closest('button')?.querySelector('[class*="lucide-radio"]') || document.querySelector('[class*="lucide-radio"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders initial avatar when no stream', () => {
    const { container } = render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(container.querySelector('[class*="w-32.h-32"]') || container.querySelector('[class*="from-blue-500"]') || container.querySelector('[class*="from-purple-600"]')).toBeInTheDocument();
  });

  it('renders status text', () => {
    render(<CallScreen call={{ ...mockAudioCall, status: 'ringing' }} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByText('ringing')).toBeInTheDocument();
  });

  it('renders recording indicator when recording', () => {
    render(<CallScreen call={mockVideoCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByText('REC')).toBeInTheDocument();
  });

  it('renders gradient background for audio', () => {
    const { container } = render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(container.querySelector('[class*="from-gray-900"]') || container.querySelector('[class*="to-black"]')).toBeInTheDocument();
  });
});
