import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LiveVideoRecorder } from './LiveVideoRecorder';

// jsdom lacks URL.createObjectURL / video.play; provide stand-ins.
if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => 'blob:mock-video',
  });
}

const defaultProps = {
  onCancel: vi.fn(),
  onSend: vi.fn(),
  onPermissionDenied: vi.fn(),
};

const installRecorder = () => {
  const MediaRecorderMock = vi.fn().mockImplementation(function (this: any, _stream: MediaStream | null) {
    Object.assign(this, {
      start: vi.fn(),
      stop: vi.fn(function (this: any) {
        this.state = 'inactive';
        if (typeof this.onstop === 'function') this.onstop();
      }),
      state: 'recording',
      ondataavailable: null,
      onstop: null,
      stream: _stream || { getTracks: () => [{ stop: vi.fn() }] },
    });
  });
  (MediaRecorderMock as any).isTypeSupported = () => false;
  (window as any).MediaRecorder = MediaRecorderMock;
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
    writable: true,
    configurable: true,
  });
  return MediaRecorderMock;
};

describe('LiveVideoRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (window as any).MediaRecorder = undefined;
    (global as any).MediaRecorder = undefined;
    (HTMLMediaElement.prototype as any).play = undefined;
  });

  it('renders recording UI with Discard and Stop and Send', async () => {
    installRecorder();
    render(<LiveVideoRecorder {...defaultProps} />);
    expect(screen.getByTitle('Discard')).toBeInTheDocument();
    expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
  });

  it('starts recording on mount', async () => {
    const MediaRecorderMock = installRecorder();
    render(<LiveVideoRecorder {...defaultProps} />);
    await waitFor(() => {
      expect(MediaRecorderMock).toHaveBeenCalled();
    });
  });

  it('requests front-facing camera with audio', async () => {
    installRecorder();
    render(<LiveVideoRecorder {...defaultProps} />);
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ video: expect.objectContaining({ facingMode: 'user' }), audio: true }),
      );
    });
  });

  it('calls onPermissionDenied and onCancel when camera access fails', async () => {
    const getUserMediaSpy = vi.fn().mockRejectedValue(new Error('Permission denied'));
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: getUserMediaSpy },
      writable: true,
      configurable: true,
    });
    (window as any).MediaRecorder = vi.fn();

    render(<LiveVideoRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(defaultProps.onPermissionDenied).toHaveBeenCalledWith(
        'Camera access is blocked. Please allow camera and microphone permissions and try again.'
      );
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  it('sends the live blob with url and duration on stop', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-video');
    installRecorder();
    render(<LiveVideoRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Stop and Send'));

    await waitFor(() => {
      expect(defaultProps.onSend).toHaveBeenCalledWith('blob:mock-video', '0:00', expect.any(Blob));
    });
  });

  it('calls onCancel when Discard clicked', async () => {
    installRecorder();
    render(<LiveVideoRecorder {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTitle('Discard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Discard'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});