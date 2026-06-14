import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SystemPulsePlayer } from './SystemPulsePlayer';
import { I18nProvider } from '../lib/i18n';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, args?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        'player.systemPlayer': 'SYSTEM PLAYER',
        'player.localTrack': 'LOCAL TRACK',
        'player.switchToRadio': 'Switch to Radio Player',
        'player.switchToLocal': 'Switch to Local Playlist',
        'player.radioLink': 'RADIO LINK',
        'player.systemPlaylist': 'System Playlist',
        'player.viewPlaylist': 'View Playlist',
        'player.backToPlayer': 'Back to Player',
        'player.hidePlaylist': 'Hide Playlist',
        'player.mute': 'Mute',
        'player.unmute': 'Unmute',
        'player.play': 'Play',
        'player.pause': 'Pause',
        'player.nextTrack': 'Next Track',
        'player.previousTrack': 'Previous Track',
        'player.noTracks': 'No Tracks',
        'player.equalizerSettings': 'Equalizer & Settings',
        'player.addTrack': 'Add Track',
        'player.addFolder': 'Add Folder',
        'player.addVideo': 'Add Video',
        'player.remove': 'Remove',
        'player.addStation': 'Add Station',
        'player.deleteConfirm': 'Delete {name}?',
        'player.videoLoaded': 'Video loaded',
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

const { useAppStore } = await import('../store');

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
    render(<I18nProvider><SystemPulsePlayer theme="dark" /></I18nProvider>);
    
    expect(screen.getByText('SYSTEM PLAYER')).toBeInTheDocument();
    expect(screen.getByText('LOCAL TRACK')).toBeInTheDocument();
  });

  it('switches to radio mode when radio button is clicked', async () => {
    render(<I18nProvider><SystemPulsePlayer theme="dark" /></I18nProvider>);
    
    // Find the toggle by title and click its child which has the click handler
    const wrapper = screen.getByTitle('Switch to Radio Player');
    const switchBtn = wrapper.children[1]; // The div with onClick is the second child after the blur div
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText('RADIO LINK')).toBeInTheDocument();
    });
  });

  it('opens and closes the playlist', async () => {
    render(<I18nProvider><SystemPulsePlayer theme="dark" /></I18nProvider>);
    
    expect(screen.queryByText('System Playlist')).not.toBeInTheDocument();
    
    const toggleBtn = screen.getByTitle('View Playlist');
    fireEvent.click(toggleBtn);
    
    await waitFor(() => {
       expect(screen.getByText('System Playlist')).toBeInTheDocument();
    });
    
    const closeBtn = screen.getByTitle('Back to Player');
    fireEvent.click(closeBtn);
    
    await waitFor(() => {
       expect(screen.queryByText('System Playlist')).not.toBeInTheDocument();
    });
  });
});
