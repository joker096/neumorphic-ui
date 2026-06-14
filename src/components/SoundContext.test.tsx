import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SoundProvider, useSound } from './SoundContext';

vi.mock('../lib/sounds/player', () => ({
  soundPlayer: {
    play: vi.fn(),
    enabled: true,
    volume: 0.7,
  },
}));

const TestConsumer: React.FC = () => {
  const { enabled, volume, play, setEnabled, setVolume } = useSound();
  return (
    <div>
      <span data-testid="enabled">{String(enabled)}</span>
      <span data-testid="volume">{volume}</span>
      <button data-testid="play" onClick={() => play('incoming-call')}>Play</button>
      <button data-testid="disable" onClick={() => setEnabled(false)}>Disable</button>
      <button data-testid="setvol" onClick={() => setVolume(0.5)}>SetVol</button>
    </div>
  );
};

describe('SoundProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <SoundProvider>
        <div>Child</div>
      </SoundProvider>
    );
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('provides default context values', () => {
    render(
      <SoundProvider>
        <TestConsumer />
      </SoundProvider>
    );
    expect(screen.getByTestId('enabled').textContent).toBe('true');
    expect(screen.getByTestId('volume').textContent).toBe('0.7');
  });

  it('toggles enabled state', () => {
    render(
      <SoundProvider>
        <TestConsumer />
      </SoundProvider>
    );
    act(() => {
      screen.getByTestId('disable').click();
    });
    expect(screen.getByTestId('enabled').textContent).toBe('false');
  });

  it('updates volume', () => {
    render(
      <SoundProvider>
        <TestConsumer />
      </SoundProvider>
    );
    act(() => {
      screen.getByTestId('setvol').click();
    });
    expect(screen.getByTestId('volume').textContent).toBe('0.5');
  });
});
