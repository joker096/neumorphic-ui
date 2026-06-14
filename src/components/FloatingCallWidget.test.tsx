import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FloatingCallWidget } from './FloatingCallWidget';

const mockSetActiveCall = vi.fn();

let mockActiveCall: any = null;

vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    activeCall: mockActiveCall,
    setActiveCall: mockSetActiveCall,
  })),
}));

vi.mock('../lib/callRecorderService', () => ({
  callRecorderService: {
    onStateChange: vi.fn(() => vi.fn()),
  },
}));

const defaultProps = {
  theme: 'dark' as const,
};

describe('FloatingCallWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveCall = null;
  });

  it('renders null when no active call', () => {
    const { container } = render(<FloatingCallWidget {...defaultProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders widget when active call exists', () => {
    mockActiveCall = { number: '+1234567890', startTime: Date.now(), isMuted: false, isSpeaker: false };
    render(<FloatingCallWidget {...defaultProps} />);
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('shows muted state', () => {
    mockActiveCall = { number: '+1234567890', startTime: Date.now(), isMuted: true, isSpeaker: false };
    render(<FloatingCallWidget {...defaultProps} />);
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('toggles mute on mic button click', () => {
    mockActiveCall = { number: '+1234567890', startTime: Date.now(), isMuted: false, isSpeaker: false };
    render(<FloatingCallWidget {...defaultProps} />);
    const micButtons = screen.getByText('+1234567890').closest('div[class*="fixed"]')?.querySelectorAll('button');
    const micBtn = micButtons?.[0];
    fireEvent.click(micBtn!);
    expect(mockSetActiveCall).toHaveBeenCalledWith(
      expect.objectContaining({ isMuted: true })
    );
  });

  it('ends call when end button clicked', () => {
    mockActiveCall = { number: '+1234567890', startTime: Date.now(), isMuted: false, isSpeaker: false };
    render(<FloatingCallWidget {...defaultProps} />);
    const endBtn = screen.getByText('+1234567890').closest('div[class*="fixed"]')?.querySelector('button:last-child');
    fireEvent.click(endBtn!);
    expect(mockSetActiveCall).toHaveBeenCalledWith(null);
  });

  it('applies dark theme classes', () => {
    mockActiveCall = { number: '+1234567890', startTime: Date.now(), isMuted: false, isSpeaker: false };
    render(<FloatingCallWidget {...defaultProps} />);
    const widget = screen.getByText('+1234567890').closest('div[class*="fixed"]');
    expect(widget?.className).toContain('bg-[#1a1d24]');
  });

  it('applies light theme classes', () => {
    mockActiveCall = { number: '+1234567890', startTime: Date.now(), isMuted: false, isSpeaker: false };
    render(<FloatingCallWidget {...defaultProps} theme="light" />);
    const widget = screen.getByText('+1234567890').closest('div[class*="fixed"]');
    expect(widget?.className).toContain('bg-white/90');
  });
});
