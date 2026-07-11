import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mockPlay = vi.fn();
const mockSetSoundEnabled = vi.fn();
const mockSetSoundVolume = vi.fn();

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => {
    const state = {
      soundEnabled: true,
      soundVolume: 0.7,
      setSoundEnabled: mockSetSoundEnabled,
      setSoundVolume: mockSetSoundVolume,
    };
    return selector(state);
  },
}));

import { SoundProvider, useSound } from './SoundContext';

function TestComponent() {
  const { enabled, volume, play } = useSound();
  return (
    <div>
      <span data-testid="enabled">{enabled.toString()}</span>
      <span data-testid="volume">{volume}</span>
      <button onClick={() => play('incoming-call')}>Play</button>
    </div>
  );
}

describe('SoundProvider', () => {
  it('provides default values via context', () => {
    render(
      <SoundProvider>
        <TestComponent />
      </SoundProvider>
    );
    expect(screen.getByTestId('enabled').textContent).toBe('true');
    expect(screen.getByTestId('volume').textContent).toBe('0.7');
  });

  it('renders children', () => {
    render(
      <SoundProvider>
        <div>Child Content</div>
      </SoundProvider>
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
