import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div> },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('lucide-react', () => ({ SkipBack: 'div', SkipForward: 'div', Play: 'div', Pause: 'div', List: 'div', Radio: 'div' }));

import { PlayerView } from './PlayerView';

const mockTrack = { id: '1', name: 'Test Track', url: '', time: '3:42', file: null };

const defaultProps = {
  isRadioMode: false,
  isPlaying: false,
  setIsPlaying: vi.fn(),
  setIsRadioMode: vi.fn(),
  volume: 50,
  setVolume: vi.fn(),
  activeList: [mockTrack],
  activeIndex: 0,
  currentTrack: mockTrack,
  nextTrack: vi.fn(),
  prevTrack: vi.fn(),
  createRipple: vi.fn(),
  initWebAudio: vi.fn(),
};

describe('PlayerView', () => {
  it('renders track counter', () => {
    render(<PlayerView {...defaultProps} />);
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('renders track name', () => {
    render(<PlayerView {...defaultProps} />);
    expect(screen.getByText('Test Track')).toBeInTheDocument();
  });

  it('renders track type label', () => {
    render(<PlayerView {...defaultProps} />);
    expect(screen.getByText('LOCAL TRACK')).toBeInTheDocument();
  });

  it('renders radio label when in radio mode', () => {
    render(<PlayerView {...defaultProps} isRadioMode={true} />);
    expect(screen.getByText('RADIO LINK')).toBeInTheDocument();
  });

  it('renders play button', () => {
    render(<PlayerView {...defaultProps} />);
    const playBtn = document.querySelector('[class*="rounded-full"]');
    expect(playBtn).toBeInTheDocument();
  });
});
