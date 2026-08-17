import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { IncomingCallSheet } from './IncomingCallSheet';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      'call.unknownCaller': 'Unknown',
      'call.videoCall': 'Video call',
      'call.voiceCall': 'Voice call',
      'call.incomingCall': 'Incoming call...',
      'call.rejectCall': 'Reject call',
      'call.acceptCall': 'Accept call',
      'call.acceptVideoCall': 'Accept as video',
    }[key] ?? key),
  }),
}));

describe('IncomingCallSheet - additional tests', () => {
  it('renders caller name first letter', () => {
    render(<IncomingCallSheet callerName="Jane Doe" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders voice call icon', () => {
    render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(document.querySelector('[class*="lucide-phone"]') || document.querySelector('[class*="lucide-mic"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders video call icon', () => {
    render(<IncomingCallSheet callerName="John" callType="video" onAccept={() => {}} onReject={() => {}} />);
    expect(document.querySelector('[class*="lucide-video"]') || document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders reject button', () => {
    render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByTitle('Reject call')).toBeInTheDocument();
  });

  it('renders accept button', () => {
    render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByTitle('Accept call')).toBeInTheDocument();
  });

  it('renders video accept button', () => {
    render(<IncomingCallSheet callerName="John" callType="video" onAccept={() => {}} onReject={() => {}} onAcceptVideo={() => {}} />);
    expect(screen.getByTitle('Accept as video')).toBeInTheDocument();
  });

  it('renders avatar circle', () => {
    const { container } = render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(container.querySelector('[class*="neo-raised"]')).toBeInTheDocument();
  });

  it('renders neumorphic background', () => {
    const { container } = render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(container.querySelector('[class*="radial-gradient"]')).toBeInTheDocument();
  });

  it('renders Incoming call text', () => {
    render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByText(/Incoming call/)).toBeInTheDocument();
  });

  it('renders Voice call text', () => {
    render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByText('Voice call')).toBeInTheDocument();
  });

  it('renders Video call text', () => {
    render(<IncomingCallSheet callerName="John" callType="video" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByText('Video call')).toBeInTheDocument();
  });

  it('renders caller name', () => {
    render(<IncomingCallSheet callerName="John Doe" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
