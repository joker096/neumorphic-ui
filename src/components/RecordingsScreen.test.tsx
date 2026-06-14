import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RecordingsScreen } from './RecordingsScreen';

const mockUpdateSettings = vi.fn();

const defaultState = {
  recordings: [
    {
      id: 'rec1',
      callId: 'call1',
      callType: 'audio' as const,
      participants: [{ userId: 'u1', displayName: 'Alice' }],
      title: 'Call with Alice',
      startedAt: Date.now() - 100000,
      duration: 120,
      recordingDuration: 115,
      fileSize: 2048576,
      mimeType: 'audio/webm',
      blobId: 'blob1',
      isFavorite: true,
      tags: [],
      createdAt: Date.now() - 100000,
    },
    {
      id: 'rec2',
      callId: 'call2',
      callType: 'video' as const,
      participants: [{ userId: 'u2', displayName: 'Bob' }],
      title: 'Video with Bob',
      startedAt: Date.now() - 50000,
      duration: 300,
      recordingDuration: 290,
      fileSize: 52428800,
      mimeType: 'video/webm',
      blobId: 'blob2',
      isFavorite: false,
      tags: [],
      createdAt: Date.now() - 50000,
    },
  ],
  recordingsSearchQuery: '',
  recordingsSortBy: 'date',
  recordingsSortOrder: 'desc',
  updateSettings: mockUpdateSettings,
  addRecording: vi.fn(),
  deleteRecording: vi.fn(),
  toggleFavorite: vi.fn(),
};

vi.mock('../store', () => ({
  useAppStore: (selector?: any) => {
    return selector ? selector(defaultState) : defaultState;
  },
}));

vi.mock('../lib/callRecorderService', () => ({
  callRecorderService: {
    getRecordingBlob: vi.fn().mockResolvedValue(new Blob()),
    deleteRecording: vi.fn().mockResolvedValue(undefined),
    exportRecording: vi.fn(),
  },
  CallRecording: {},
}));

const defaultProps = {
  theme: 'dark' as const,
  onBack: vi.fn(),
};

describe('RecordingsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the screen title', () => {
    render(<RecordingsScreen {...defaultProps} />);
    expect(screen.getByText('recordings.title')).toBeInTheDocument();
  });

  it('shows recording list', () => {
    render(<RecordingsScreen {...defaultProps} />);
    expect(screen.getByText('Call with Alice')).toBeInTheDocument();
    expect(screen.getByText('Video with Bob')).toBeInTheDocument();
  });

  it('has search input', () => {
    render(<RecordingsScreen {...defaultProps} />);
    expect(screen.getByPlaceholderText('recordings.search')).toBeInTheDocument();
  });

  it('updates search query on input', () => {
    render(<RecordingsScreen {...defaultProps} />);
    const input = screen.getByPlaceholderText('recordings.search');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(mockUpdateSettings).toHaveBeenCalledWith({ recordingsSearchQuery: 'Alice' });
  });

  it('calls onBack when back button clicked', () => {
    render(<RecordingsScreen {...defaultProps} />);
    const backBtn = screen.getByText('recordings.title').closest('[class*="flex"]')?.querySelector('button');
    fireEvent.click(backBtn!);
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('applies dark theme', () => {
    render(<RecordingsScreen {...defaultProps} />);
    expect(screen.getByText('recordings.title').className).toContain('text-white');
  });
});
