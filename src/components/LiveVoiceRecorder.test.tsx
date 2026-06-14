import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LiveVoiceRecorder } from './LiveVoiceRecorder';
import { I18nProvider } from '../lib/i18n';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, args?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        'voiceRecorder.discard': 'Discard',
        'voiceRecorder.rerecord': 'Re-record',
        'voiceRecorder.send': 'Send',
        'voiceRecorder.stopAndSend': 'Stop and Send',
        'voiceRecorder.pause': 'Pause',
        'voiceRecorder.resume': 'Resume',
        'voiceRecorder.micBlocked': 'Microphone access is blocked. Please allow microphone permissions and try again.',
        'voiceRecorder.preview': 'Voice note preview',
      };
      let text = translations[key] || key;
      if (args) {
        for (const [k, v] of Object.entries(args)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    lang: 'en',
    setLang: () => {},
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => <>{children}</> },
  detectBrowserLanguage: () => 'en',
}));

const defaultProps = {
  isDark: true,
  onCancel: vi.fn(),
  onSend: vi.fn(),
  onReRecord: vi.fn(),
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
    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);
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
    
    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);

    await waitFor(() => {
      expect(MediaRecorderMock).toHaveBeenCalled();
    });
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
    
    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);

    await waitFor(() => {
      expect(defaultProps.onPermissionDenied).toHaveBeenCalledWith(
        'Microphone access is blocked. Please allow microphone permissions and try again.'
      );
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  it('handles pause/resume button display', () => {
    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);
    // Component renders with recording controls
    expect(screen.getByTitle('Discard')).toBeInTheDocument();
  });

  it('shows preview with Send, Re-record, Discard buttons', async () => {
    const mockOnstop = vi.fn();
    
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: MediaStream | null) {
      Object.assign(this, {
        start: vi.fn(),
        stop: vi.fn(),
        state: 'recording',
        ondataavailable: null,
        onstop: mockOnstop,
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
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
      writable: true,
      configurable: true,
    });
    (window as any).MediaRecorder = MediaRecorderMock;

    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);

    await waitFor(() => {
      expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Stop and Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Send')).toBeInTheDocument();
      expect(screen.getByText('Re-record')).toBeInTheDocument();
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });
  });

  it('calls onSend when Send clicked in preview', async () => {
    const mockOnstop = vi.fn();
    
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: MediaStream | null) {
      Object.assign(this, {
        start: vi.fn(),
        stop: vi.fn(),
        state: 'recording',
        ondataavailable: null,
        onstop: mockOnstop,
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
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
      writable: true,
      configurable: true,
    });
    (window as any).MediaRecorder = MediaRecorderMock;

    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);

    await waitFor(() => {
      expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Stop and Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Send')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Send'));
    expect(defaultProps.onSend).toHaveBeenCalled();
  });

  it('calls onReRecord when Re-record clicked', async () => {
    const mockOnstop = vi.fn();
    
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: MediaStream | null) {
      Object.assign(this, {
        start: vi.fn(),
        stop: vi.fn(),
        state: 'recording',
        ondataavailable: null,
        onstop: mockOnstop,
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
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
      writable: true,
      configurable: true,
    });
    (window as any).MediaRecorder = MediaRecorderMock;

    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);

    await waitFor(() => {
      expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Stop and Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Re-record')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Re-record'));
    expect(defaultProps.onReRecord).toHaveBeenCalled();
  });

  it('calls onCancel when Discard clicked', async () => {
    const mockOnstop = vi.fn();
    
    const MediaRecorderMock = vi.fn().mockImplementation(function(this: any, stream: MediaStream | null) {
      Object.assign(this, {
        start: vi.fn(),
        stop: vi.fn(),
        state: 'recording',
        ondataavailable: null,
        onstop: mockOnstop,
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
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
      writable: true,
      configurable: true,
    });
    (window as any).MediaRecorder = MediaRecorderMock;

    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);

    await waitFor(() => {
      expect(screen.getByTitle('Stop and Send')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Stop and Send'));
    
    await waitFor(() => {
      expect(screen.getByText('Discard')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Discard'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('applies dark theme styles', () => {
    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} /></I18nProvider>);
    const container = screen.getByTitle('Discard').closest('div[class*="bg-[#13151b]"]');
    expect(container).toBeInTheDocument();
  });

  it('applies light theme styles', () => {
    const { container } = render(<I18nProvider><LiveVoiceRecorder {...{ ...defaultProps, isDark: false }} /></I18nProvider>);
    expect(container.querySelector('div[class*="bg-[#f4f7f9]"]')).toBeInTheDocument();
  });

  it('adds window event listeners for hold-to-record', async () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} holdToRecord={true} /></I18nProvider>);

    await waitFor(() => {
      expect(addListenerSpy).toHaveBeenCalledWith('pointerup', expect.any(Function), { once: true });
      expect(addListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), { once: true });
      expect(addListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), { once: true });
      expect(addListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function), { once: true });
    });
  });

  it('does not add window event listeners when holdToRecord is false', async () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
    render(<I18nProvider><LiveVoiceRecorder {...defaultProps} holdToRecord={false} /></I18nProvider>);

    await waitFor(() => {
      expect(addListenerSpy).not.toHaveBeenCalled();
    });
  });
});
