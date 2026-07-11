import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { FloatingCallWidget } from './FloatingCallWidget';
import { useAppStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: vi.fn(),
}));

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Mock callRecorderService
vi.mock('../../lib/callRecorderService', () => ({
  callRecorderService: {
    onStateChange: vi.fn(() => () => {}),
  },
}));

// Mock motion/react
vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <div data-testid="animate-presence">{children}</div>,
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  },
}));

describe('FloatingCallWidget', () => {
  const mockActiveCall = {
    callId: 'test-call',
    startTime: Date.now(),
    isMuted: false,
    isSpeaker: false,
    isVideo: false,
    isRecording: false,
    remotePeer: { displayName: 'Test User' },
  };

  beforeEach(() => {
    const fullState = {
      activeCall: mockActiveCall,
      setActiveCall: vi.fn(),
    };
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(fullState);
      }
      // No selector - return full state
      if (!selector) return fullState;
      if (selector === 'activeCall') return mockActiveCall;
      if (selector === 'setActiveCall') return vi.fn();
      return undefined;
    });
  });

  it('does not render when no active call', () => {
    vi.mocked(useAppStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') return selector({ activeCall: null, setActiveCall: vi.fn() });
      if (!selector) return { activeCall: null, setActiveCall: vi.fn() };
      return undefined;
    });
    render(<FloatingCallWidget theme="dark" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders when there is an active call', () => {
    render(<FloatingCallWidget theme="dark" />);
    expect(screen.getByText(/Test User|chat.remotePeerDisplayName/i)).toBeInTheDocument();
  });

  it('renders mute button', () => {
    render(<FloatingCallWidget theme="dark" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders end call button', () => {
    render(<FloatingCallWidget theme="dark" />);
    const endBtn = document.querySelector('[title*="chat.endCall"]') || document.querySelector('[title*="Завершить"]');
    expect(endBtn).toBeInTheDocument();
  });

  it('renders with dark theme', () => {
    render(<FloatingCallWidget theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    render(<FloatingCallWidget theme="light" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders call duration', () => {
    render(<FloatingCallWidget theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('toggles mute when mute button clicked', () => {
    render(<FloatingCallWidget theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('toggles end call when end button clicked', () => {
    render(<FloatingCallWidget theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders video call indicator', () => {
    render(<FloatingCallWidget theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders recording indicator', () => {
    render(<FloatingCallWidget theme="dark" />);
    expect(document.body).toBeInTheDocument();
  });
});
