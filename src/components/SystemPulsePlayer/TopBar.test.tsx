import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  QrCode: 'div', Settings: 'div', Plus: 'div', SlidersHorizontal: 'div',
  Trash2: 'div', Save: 'div', Headphones: 'div', FolderOpen: 'div',
  Folder: 'div', X: 'div', Video: 'div', ListMusic: 'div', List: 'div', Radio: 'div',
}));

import { TopBar } from './TopBar';

const defaultProps = {
  isRadioMode: false,
  showEq: false,
  showPlaylist: false,
  setShowEq: vi.fn(),
  setShowPlaylist: vi.fn(),
  handleFileSelect: vi.fn(),
  handleFolderSelect: vi.fn(),
  handleVideoFileSelect: vi.fn(),
  setIsRadioMode: vi.fn(),
  setShowAddStationModal: vi.fn(),
  setStationName: vi.fn(),
  setStationUrl: vi.fn(),
  setStationAddError: vi.fn(),
  setRadioStations: vi.fn(),
  eqGains: [0, 0, 0, 0, 0],
  setEqGains: vi.fn(),
  volume: 50,
  setVolume: vi.fn(),
  isPlaying: false,
  setIsPlaying: vi.fn(),
  showAddStationModal: false,
  stationName: '',
  stationUrl: '',
  stationAddError: '',
  activeList: [],
  setCurrentTrackIndex: vi.fn(),
  setRadioStationIndex: vi.fn(),
  currentTrackIndex: 0,
  radioStationIndex: 0,
  currentPreset: 'Flat',
  setCurrentPreset: vi.fn(),
  savedPresets: [],
  setSavedPresets: vi.fn(),
  applyPreset: vi.fn(),
  savePreset: vi.fn(),
  deletePreset: vi.fn(),
  initWebAudio: vi.fn(),
};

describe('TopBar', () => {
  it('renders equalizer button', () => {
    render(<TopBar {...(defaultProps as any)} />);
    const eqBtn = screen.getByTitle('Equalizer & Settings');
    expect(eqBtn).toBeInTheDocument();
  });

  it('renders add track button', () => {
    render(<TopBar {...(defaultProps as any)} />);
    const addBtn = screen.getByTitle('Add Track');
    expect(addBtn).toBeInTheDocument();
  });

  it('renders add folder button', () => {
    render(<TopBar {...(defaultProps as any)} />);
    const folderBtn = screen.getByTitle('Add Folder');
    expect(folderBtn).toBeInTheDocument();
  });

  it('renders playlist button', () => {
    render(<TopBar {...(defaultProps as any)} />);
    const playlistBtn = screen.getByTitle('View Playlist');
    expect(playlistBtn).toBeInTheDocument();
  });
});
