import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('lucide-react', () => ({ Trash2: 'div', Music: 'div', Radio: 'div', Plus: 'div', ChevronLeft: 'div' }));

vi.mock('../../lib/i18n', () => {
  const translations: Record<string, string> = {
    'systemPlayer.backToPlayer': 'Back to Player',
    'systemPlayer.radioStations': 'Radio Stations',
    'systemPlayer.systemPlaylist': 'System Playlist',
    'systemPlayer.addTrack': 'Add Track',
    'systemPlayer.addStation': 'Add Station',
    'systemPlayer.remove': 'Remove',
  };
  return {
    useI18n: () => ({
      lang: 'en',
      setLang: () => {},
      t: (key: string) => translations[key] ?? key,
    }),
  };
});

import { PlaylistView } from './PlaylistView';

const mockTracks = [
  { id: '1', name: 'Track 1', url: '', time: '3:42', file: null },
  { id: '2', name: 'Track 2', url: '', time: '4:15', file: null },
];

const defaultProps = {
  isRadioMode: false,
  isPlaying: false,
  setIsPlaying: vi.fn(),
  showPlaylist: true,
  setShowPlaylist: vi.fn(),
  activeList: mockTracks,
  activeIndex: 0,
  confirmDeleteIndex: null,
  setConfirmDeleteIndex: vi.fn(),
  confirmDeleteMode: 'playlist' as const,
  setConfirmDeleteMode: vi.fn(),
  currentTrackIndex: 0,
  setCurrentTrackIndex: vi.fn(),
  radioStationIndex: 0,
  setRadioStationIndex: vi.fn(),
  playlist: mockTracks,
  setPlaylist: vi.fn(),
  radioStations: [],
  setRadioStations: vi.fn(),
  videoUrl: null,
  openVideoUrl: vi.fn(),
  setShowVideo: vi.fn(),
  setIsVideoPlaying: vi.fn(),
  setShowAddStationModal: vi.fn(),
  stationName: '',
  setStationName: vi.fn(),
  stationUrl: '',
  setStationUrl: vi.fn(),
  stationAddError: '',
  setStationAddError: vi.fn(),
  handleFileSelect: vi.fn(),
};

describe('PlaylistView', () => {
  it('renders playlist title for local mode', () => {
    render(<PlaylistView {...defaultProps} />);
    expect(screen.getByText('System Playlist')).toBeInTheDocument();
  });

  it('renders track names', () => {
    render(<PlaylistView {...defaultProps} />);
    expect(screen.getByText('Track 1')).toBeInTheDocument();
    expect(screen.getByText('Track 2')).toBeInTheDocument();
  });

  it('renders radio stations title in radio mode', () => {
    render(<PlaylistView {...defaultProps} isRadioMode={true} />);
    expect(screen.getByText('Radio Stations')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(<PlaylistView {...defaultProps} />);
    const backBtn = screen.getByTitle('Back to Player');
    expect(backBtn).toBeInTheDocument();
  });

  it('wires the add track file input to handleFileSelect', () => {
    const handleFileSelect = vi.fn();
    render(<PlaylistView {...defaultProps} handleFileSelect={handleFileSelect} />);
    fireEvent.change(screen.getByTitle('Add Track').querySelector('input') as HTMLInputElement, {
      target: { files: [new File(['x'], 'a.mp3', { type: 'audio/mpeg' })] },
    });
    expect(handleFileSelect).toHaveBeenCalledTimes(1);
  });
});
