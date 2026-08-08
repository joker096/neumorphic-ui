import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SystemPulsePlayer } from './SystemPulsePlayer/SystemPulsePlayer';
import { I18nContext } from '../lib/i18n.tsx';

const mockT = (key: string) => {
  const map: Record<string, string> = {
    'systemPlayer.localTrack': 'LOCAL TRACK',
    'systemPlayer.radioLink': 'RADIO LINK',
    'systemPlayer.switchToRadio': 'Switch to Radio Player',
    'systemPlayer.switchToPlaylist': 'Switch to Playlist',
  };
  return map[key] ?? key;
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nContext.Provider value={{ lang: 'en', setLang: () => {}, t: mockT }}>
    {children}
  </I18nContext.Provider>
);

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div> },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock Web Audio API
beforeAll(() => {
  (window as any).AudioContext = vi.fn().mockImplementation(() => ({
    createMediaElementSource: vi.fn().mockReturnValue({
      connect: vi.fn(),
    }),
    createBiquadFilter: vi.fn().mockReturnValue({
      type: '',
      frequency: { value: 0 },
      Q: { value: 0 },
      gain: { value: 0 },
      connect: vi.fn(),
    }),
    state: 'running',
    resume: vi.fn(),
    destination: {},
  }));
});

describe('SystemPulsePlayer', () => {
   it('renders the player with default local tracks', () => {
      render(<SystemPulsePlayer theme="dark" />, { wrapper });
      expect(screen.getByText('LOCAL TRACK')).toBeInTheDocument();
    });

   it('switches to radio mode when radio button is clicked', async () => {
    const { container } = render(<SystemPulsePlayer theme="dark" />, { wrapper });
    
    // Find the toggle by title and click its child which has the click handler
    const wrapperEl = screen.getByTitle('Switch to Radio Player');
    const switchBtn = wrapperEl.children[1]; // The div with onClick is the second child after the blur div
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText('RADIO LINK')).toBeInTheDocument();
    });
  });

it('opens and closes the playlist', async () => {
     render(<SystemPulsePlayer theme="dark" />, { wrapper });

     const toggleBtns = screen.getAllByRole('button', { hidden: true });
     const playlistBtn = toggleBtns[screen.getAllByRole('button', { hidden: true }).length - 1];
     fireEvent.click(playlistBtn);

     await waitFor(() => {
        expect(screen.getByText('System Playlist')).toBeInTheDocument();
     });

     const closeBtn = screen.getByRole('button', { hidden: true });
     fireEvent.click(closeBtn);

     await waitFor(() => {
        expect(screen.queryByText('System Playlist')).not.toBeInTheDocument();
     });
   });
});
