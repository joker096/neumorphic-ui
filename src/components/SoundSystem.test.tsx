import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SoundSystem } from './SoundSystem';

vi.mock('../lib/sounds/player', () => ({
  soundPlayer: {
    play: vi.fn(),
  },
}));

describe('SoundSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null', () => {
    const { container } = render(<SoundSystem />);
    expect(container.innerHTML).toBe('');
  });

  it('accepts onPlay callback', () => {
    const onPlay = vi.fn();
    render(<SoundSystem onPlay={onPlay} />);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('does not throw without onPlay', () => {
    expect(() => render(<SoundSystem />)).not.toThrow();
  });
});
