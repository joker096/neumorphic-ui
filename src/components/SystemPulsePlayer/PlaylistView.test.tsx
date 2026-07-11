import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('lucide-react', () => ({ Trash2: 'div', Music: 'div', Radio: 'div', Plus: 'div' }));

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
  setVideoUrl: vi.fn(),
  setShowVideo: vi.fn(),
  setIsVideoPlaying: vi.fn(),
  setShowAddStationModal: vi.fn(),
  stationName: '',
  setStationName: vi.fn(),
  stationUrl: '',
  setStationUrl: vi.fn(),
  stationAddError: '',
  setStationAddError: vi.fn(),
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
});
