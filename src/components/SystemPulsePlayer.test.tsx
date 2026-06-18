import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SystemPulsePlayer } from './SystemPulsePlayer';

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
     render(<SystemPulsePlayer theme="dark" />);
     expect(screen.getByText('LOCAL TRACK')).toBeInTheDocument();
   });

   it('switches to radio mode when radio button is clicked', async () => {
    const { container } = render(<SystemPulsePlayer theme="dark" />);
    
    // Find the toggle by title and click its child which has the click handler
    const wrapper = screen.getByTitle('Switch to Radio Player');
    const switchBtn = wrapper.children[1]; // The div with onClick is the second child after the blur div
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText('RADIO LINK')).toBeInTheDocument();
    });
  });

it('opens and closes the playlist', async () => {
     render(<SystemPulsePlayer theme="dark" />);

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
