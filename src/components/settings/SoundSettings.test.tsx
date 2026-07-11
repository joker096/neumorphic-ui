import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mockPlay = vi.fn();

vi.mock('./SoundContext', () => ({
  useSound: () => ({
    enabled: true,
    volume: 0.7,
    play: mockPlay,
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
  }),
}));

vi.mock('../../lib/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import { SoundSettings } from './SoundSettings';

describe('SoundSettings', () => {
  it('renders sound enabled toggle', () => {
    render(<SoundSettings />);
    expect(screen.getByText('soundSettings.soundEnabled')).toBeInTheDocument();
  });

  it('renders volume label', () => {
    render(<SoundSettings />);
    expect(screen.getByText('soundSettings.volume')).toBeInTheDocument();
  });

  it('renders test sound buttons', () => {
    render(<SoundSettings />);
    expect(screen.getByText('soundSettings.testCall')).toBeInTheDocument();
    expect(screen.getByText('soundSettings.testChat')).toBeInTheDocument();
    expect(screen.getByText('soundSettings.testError')).toBeInTheDocument();
  });

  it('renders volume slider', () => {
    render(<SoundSettings />);
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeInTheDocument();
  });
});
