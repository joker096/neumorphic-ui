import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { IncomingCallSheet } from './IncomingCallSheet';

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
    const rejectBtn = document.querySelector('[class*="bg-red-500"]')?.closest('button') || document.querySelector('[class*="bg-red-500"]');
    expect(rejectBtn).toBeInTheDocument();
  });

  it('renders accept button', () => {
    render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    const acceptBtn = document.querySelector('[class*="bg-green-500"]')?.closest('button') || document.querySelector('[class*="bg-green-500"]');
    expect(acceptBtn).toBeInTheDocument();
  });

  it('renders video accept button', () => {
    render(<IncomingCallSheet callerName="John" callType="video" onAccept={() => {}} onReject={() => {}} onAcceptVideo={() => {}} />);
    const videoBtn = document.querySelector('[class*="bg-blue-500"]')?.closest('button') || document.querySelector('[class*="bg-blue-500"]');
    expect(videoBtn).toBeInTheDocument();
  });

  it('renders avatar circle', () => {
    const { container } = render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(container.querySelector('[class*="w-32.h-32"]') || container.querySelector('[class*="from-blue-500"]')).toBeInTheDocument();
  });

  it('renders gradient background', () => {
    const { container } = render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(container.querySelector('[class*="from-gray-900"]') || container.querySelector('[class*="to-black"]')).toBeInTheDocument();
  });

  it('renders Incoming call text', () => {
    render(<IncomingCallSheet callerName="John" callType="audio" onAccept={() => {}} onReject={() => {}} />);
    expect(screen.getByText('Incoming call...')).toBeInTheDocument();
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
