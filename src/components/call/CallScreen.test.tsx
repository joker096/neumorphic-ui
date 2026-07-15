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
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    span: ({ children, ...props }: any) => {
      const { animate, transition, ...rest } = props;
      return <span {...rest}>{children}</span>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
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
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders unmuted state', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders video mode with local stream', () => {
    const { container } = render(<CallScreen call={mockVideoCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    const videos = container.querySelectorAll('video');
    expect(videos.length).toBeGreaterThan(0);
  });

  it('renders end call button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByTitle('End call')).toBeInTheDocument();
  });

  it('renders mute button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByTitle('Mute')).toBeInTheDocument();
  });

  it('renders video toggle when video mode', () => {
    render(<CallScreen call={mockVideoCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByTitle('Turn off video')).toBeInTheDocument();
  });

  it('renders screen share button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByTitle('Share screen')).toBeInTheDocument();
  });

  it('renders record button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByTitle('Record')).toBeInTheDocument();
  });

  it('renders call type switch button', () => {
    render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(screen.getByTitle('Switch to Video')).toBeInTheDocument();
  });

  it('renders initial avatar when no stream', () => {
    const { container } = render(<CallScreen call={mockAudioCall} onEnd={() => {}} onToggleMute={() => {}} onToggleVideo={() => {}} onToggleScreen={() => {}} onToggleRecord={() => {}} />);
    expect(container.querySelector('[class*="w-36.h-36"]') || container.querySelector('[class*="from-orange-500"]')).toBeInTheDocument();
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
    expect(container.querySelector('[class*="from-zinc-900"]') || container.querySelector('[class*="to-black"]')).toBeInTheDocument();
  });
});
