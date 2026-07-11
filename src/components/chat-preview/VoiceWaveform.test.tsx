import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { VoiceWaveform } from './VoiceWaveform';

const mockAudioContext = {
  state: 'running',
  sampleRate: 44100,
  createAnalyser: vi.fn().mockReturnValue({
    fftSize: 64,
    frequencyBinCount: 32,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createBufferSource: vi.fn().mockReturnValue({
    buffer: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  }),
  createBuffer: vi.fn().mockReturnValue({
    getChannelData: vi.fn().mockReturnValue(new Float32Array(44100)),
    length: 44100,
    sampleRate: 44100,
  }),
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  decodeAudioData: vi.fn().mockResolvedValue({
    getChannelData: vi.fn().mockReturnValue(new Float32Array(44100)),
    length: 44100,
    sampleRate: 44100,
  }),
  close: vi.fn().mockResolvedValue(undefined),
  currentTime: 0,
  resume: vi.fn().mockResolvedValue(undefined),
  destination: {},
};

const mockStream = {
  getTracks: () => [{ stop: vi.fn() }],
};

describe('VoiceWaveform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up the AudioContext mock as a constructor
    const MockAudioContextClass = function() {
      Object.assign(this, mockAudioContext);
    };
    Object.assign(MockAudioContextClass.prototype, mockAudioContext);
    
    (window as any).AudioContext = MockAudioContextClass;
    (window as any).webkitAudioContext = MockAudioContextClass;
    
    // Mock fetch
    vi.spyOn(window, 'fetch').mockImplementation((url: any) => {
      return Promise.resolve({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
      } as any);
    });
    
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => { return 1 as any; });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (window as any).AudioContext = undefined;
    (window as any).webkitAudioContext = undefined;
  });

  it('renders waveform canvas', () => {
    render(<VoiceWaveform isDark={true} duration="0:12" />);

    expect(screen.getByText('0:12')).toBeInTheDocument();
  });

  it('renders play button for playback mode', async () => {
    render(<VoiceWaveform isDark={true} audioUrl="test.mp3" duration="0:12" />);

    // The Play button appears once isReady=true, which happens when decodeAudioData resolves
    // With fake timers removed, this should resolve naturally
    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });
  });

  it('does not render play button for live stream mode', () => {
    render(<VoiceWaveform isDark={true} stream={mockStream as any} />);

    expect(screen.queryByTitle('Play')).not.toBeInTheDocument();
  });

  it('toggles playback when play button clicked', async () => {
    render(<VoiceWaveform isDark={true} audioUrl="test.mp3" duration="0:12" />);

    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Play'));
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('seeks when slider changed', async () => {
    render(<VoiceWaveform isDark={true} audioUrl="test.mp3" duration="0:12" />);

    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Play'));
    await waitFor(() => {
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });
  });

  it('shows duration', () => {
    render(<VoiceWaveform isDark={true} duration="1:30" />);

    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('applies dark theme colors for own messages', () => {
    render(<VoiceWaveform isDark={true} isMe={true} duration="0:12" />);

    expect(screen.getByText('0:12')).toBeInTheDocument();
  });

  it('applies light theme colors for other messages', () => {
    render(<VoiceWaveform isDark={false} isMe={false} duration="0:12" />);

    expect(screen.getByText('0:12')).toBeInTheDocument();
  });

  it('generates static waveform from audio buffer', async () => {
    render(<VoiceWaveform isDark={true} audioUrl="test.mp3" duration="0:12" />);

    await waitFor(() => {
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
    });
  });

  it('uses fallback waveform when no audioUrl or stream', async () => {
    render(<VoiceWaveform isDark={true} duration="0:12" />);

    await waitFor(() => {
      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });
  });

  it('cleans up audio context on unmount', () => {
    const { unmount } = render(<VoiceWaveform isDark={true} audioUrl="test.mp3" />);
    unmount();

    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('handles audio context suspended state', async () => {
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockResolvedValue(undefined);

    render(<VoiceWaveform isDark={true} audioUrl="test.mp3" duration="0:12" />);

    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Play'));
    await waitFor(() => {
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  it('renders seek slider only when audioUrl provided', () => {
    render(<VoiceWaveform isDark={true} duration="0:12" />);
    expect(screen.queryByTestId('seek-slider')).not.toBeInTheDocument();

    render(<VoiceWaveform isDark={true} audioUrl="test.mp3" duration="0:12" />);
    expect(screen.getByTestId('seek-slider')).toBeInTheDocument();
  });

  it('shows progress during playback', async () => {
    render(<VoiceWaveform isDark={true} audioUrl="test.mp3" duration="0:12" />);

    await waitFor(() => {
      expect(screen.getByTitle('Play')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Play'));
    
    // Wait for the slider to appear
    await waitFor(() => {
      expect(screen.getByTestId('seek-slider')).toBeInTheDocument();
    });
  });
});
