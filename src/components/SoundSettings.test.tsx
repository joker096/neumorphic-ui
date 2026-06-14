import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SoundSettings } from './SoundSettings';

const mockPlay = vi.fn();

vi.mock('./SoundContext', () => ({
  useSound: vi.fn(() => ({
    enabled: true,
    volume: 0.7,
    play: mockPlay,
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
  })),
}));

describe('SoundSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the sound toggle', () => {
    render(<SoundSettings />);
    expect(screen.getByText('sound.enabled')).toBeInTheDocument();
    expect(screen.getByText('sound.testCall')).toBeInTheDocument();
    expect(screen.getByText('sound.testChat')).toBeInTheDocument();
    expect(screen.getByText('sound.testError')).toBeInTheDocument();
  });

  it('has a volume slider', () => {
    render(<SoundSettings />);
    const slider = screen.getByText('sound.volume').nextElementSibling as HTMLInputElement;
    expect(slider).toBeInTheDocument();
    expect(slider.type).toBe('range');
  });

  it('plays test sound when test button clicked', () => {
    render(<SoundSettings />);
    fireEvent.click(screen.getByText('sound.testCall'));
    expect(mockPlay).toHaveBeenCalledWith('incoming-call');
  });

  it('plays chat test sound', () => {
    render(<SoundSettings />);
    fireEvent.click(screen.getByText('sound.testChat'));
    expect(mockPlay).toHaveBeenCalledWith('incoming-chat');
  });

  it('plays error test sound', () => {
    render(<SoundSettings />);
    fireEvent.click(screen.getByText('sound.testError'));
    expect(mockPlay).toHaveBeenCalledWith('error');
  });
});
