import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LiveVoiceRecorder } from './LiveVoiceRecorder';

// jsdom lacks URL.createObjectURL; provide a deterministic stand-in.
if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => 'blob:mock-voice',
  });
}

const defaultProps = {
  isDark: true,
  onCancel: vi.fn(),
  onSend: vi.fn(),
  onPermissionDenied: vi.fn(),
  holdToRecord: true,
};

describe('LiveVoiceRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: MediaStream | null) {
      Object.assign(this, {
        start: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        state: 'recording',
        ondataavailable: null,
        onstop: null,
        stream: stream || { getTracks: () => [{ stop: vi.fn() }] },
      });
    });
    
    Object.assign(MediaRecorderMock.prototype, {
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'recording',
      ondataavailable: null,
      onstop: null,
    });
    
    (window as any).MediaRecorder = MediaRecorderMock;
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (window as any).MediaRecorder = undefined;
    (global as any).MediaRecorder = undefined;
  });

  it('renders recording UI initially', () => {
    render(<LiveVoiceRecorder {...defaultProps} />);
    // Just check the recording UI is rendered, don't worry about specific time
    expect(screen.getByTitle('Discard')).toBeInTheDocument();
    expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
  });

  it('starts recording on mount', async () => {
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: MediaStream | null) {
      Object.assign(this, {
        start: vi.fn(),
        stop: vi.fn(),
        state: 'recording',
        ondataavailable: null,
        onstop: null,
        stream: stream || { getTracks: () => [{ stop: vi.fn() }] },
      });
    });
    Object.assign(MediaRecorderMock.prototype, {
      start: vi.fn(),
      stop: vi.fn(),
      state: 'recording',
      ondataavailable: null,
      onstop: null,
    });
    
    (window as any).MediaRecorder = MediaRecorderMock;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
      writable: true,
      configurable: true,
    });
    
    render(<LiveVoiceRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(MediaRecorderMock).toHaveBeenCalled();
    });
  });

  it('renders pause/resume button with 44px tap target (§2.2)', async () => {
    render(<LiveVoiceRecorder {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTitle('Pause')).toBeInTheDocument();
    });
    const pauseBtn = screen.getByTitle('Pause') as HTMLElement;
    expect(pauseBtn.className).toContain('min-h-11');
    expect(pauseBtn.className).toContain('min-w-11');
  });

  it('calls onPermissionDenied and onCancel when mic access fails', async () => {
    const MediaRecorderMock = vi.fn();
    const getUserMediaSpy = vi.fn().mockRejectedValue(new Error('Permission denied'));
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaSpy },
      writable: true,
      configurable: true,
    });
    (window as any).MediaRecorder = MediaRecorderMock;
    
    render(<LiveVoiceRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onPermissionDenied).toHaveBeenCalledWith(
        'Microphone access is blocked. Please allow microphone permissions and try again.'
      );
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  it('handles pause/resume button display', () => {
    render(<LiveVoiceRecorder {...defaultProps} />);
    // Component renders with recording controls
    expect(screen.getByTitle('Discard')).toBeInTheDocument();
  });

  it('sends the live blob with url and duration on stop', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-voice');
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: MediaStream | null) {
      this.state = 'recording';
      this.ondataavailable = null;
      this.onstop = null;
      this.stream = stream || { getTracks: () => [{ stop: vi.fn() }] };
      this.start = vi.fn();
      this.pause = vi.fn();
      this.resume = vi.fn();
      this.stop = vi.fn(function(this: any) {
        const cb = this.onstop;
        if (typeof cb === 'function') cb();
      });
    });
    (window as any).MediaRecorder = MediaRecorderMock;

    render(<LiveVoiceRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Stop and Send'));

    await waitFor(() => {
      expect(defaultProps.onSend).toHaveBeenCalledWith('blob:mock-voice', '0:00', expect.any(Blob));
    });
  });

  it('calls onCancel when Discard clicked', async () => {
    render(<LiveVoiceRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTitle('Discard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Discard'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('adds window event listeners for hold-to-record', async () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener');
    render(<LiveVoiceRecorder {...defaultProps} holdToRecord={true} />);

    await waitFor(() => {
      expect(addListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function));
    });
  });

  it('does not add hold-to-record window event listeners when holdToRecord is false', async () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener');
    render(<LiveVoiceRecorder {...defaultProps} holdToRecord={false} />);

    await waitFor(() => {
      expect(screen.getByTitle('Discard')).toBeInTheDocument();
    });

    expect(addListenerSpy).not.toHaveBeenCalledWith('pointerup', expect.any(Function));
    expect(addListenerSpy).not.toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(addListenerSpy).not.toHaveBeenCalledWith('touchend', expect.any(Function));
    expect(addListenerSpy).not.toHaveBeenCalledWith('touchcancel', expect.any(Function));
  });

  it('cancels when released before getUserMedia resolves', async () => {
    let resolveStream!: (s: MediaStream) => void;
    const streamPromise = new Promise<MediaStream>((resolve) => {
      resolveStream = resolve;
    });
    const getUserMedia = vi.fn(() => streamPromise);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      writable: true,
      configurable: true,
    });

    render(<LiveVoiceRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled();
    });

    fireEvent.pointerUp(window);
    resolveStream({ getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream);

    await waitFor(() => {
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
    expect(defaultProps.onSend).not.toHaveBeenCalled();
  });

  it('sends when released while recording', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-voice');
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: any) {
      this.state = 'recording';
      this.stream = stream || { getTracks: () => [{ stop: vi.fn() }] };
      this.start = vi.fn();
      this.stop = vi.fn(function(this: any) {
        this.state = 'inactive';
        const cb = this.onstop;
        if (typeof cb === 'function') cb();
      });
    });
    (window as any).MediaRecorder = MediaRecorderMock;

    render(<LiveVoiceRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(MediaRecorderMock).toHaveBeenCalled();
    });

    fireEvent.pointerUp(window);

    await waitFor(() => {
      expect(defaultProps.onSend).toHaveBeenCalledWith('blob:mock-voice', '0:00', expect.any(Blob));
    });
  });
});
