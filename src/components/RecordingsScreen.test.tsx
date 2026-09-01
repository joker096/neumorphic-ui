import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RecordingsScreen } from './RecordingsScreen';
import { useAppStore } from '../store';
import { recordingStorage } from '../lib/recordingStorage';
import { callRecorderService, type CallRecording } from '../lib/callRecorderService';

vi.mock('motion/react', () => ({ motion: { div: 'div', button: 'button' } }));

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key),
  }),
}));

vi.mock('../lib/recordingStorage', () => ({
  recordingStorage: {
    listRecordings: vi.fn(),
    deleteRecording: vi.fn(),
  },
}));

vi.mock('../lib/callRecorderService', () => ({
  callRecorderService: {
    getRecordingBlob: vi.fn(),
    exportRecording: vi.fn(),
  },
}));

const NOW = Date.now();

function recording(id: string, overrides: Partial<CallRecording> = {}): CallRecording {
  return {
    id,
    callId: id,
    callType: 'audio',
    participants: [],
    startedAt: NOW,
    duration: 0,
    recordingDuration: 0,
    fileSize: 0,
    mimeType: 'audio/webm',
    blobId: id,
    isFavorite: false,
    tags: [],
    createdAt: NOW,
    ...overrides,
  };
}

describe('RecordingsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    useAppStore.setState({ recordings: [] });
    (recordingStorage.listRecordings as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (recordingStorage.deleteRecording as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (callRecorderService.getRecordingBlob as ReturnType<typeof vi.fn>).mockResolvedValue(new Blob(['x']));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the empty state when nothing is recorded', async () => {
    render(<RecordingsScreen />);
    expect(await screen.findByText('Your call recordings will appear here')).toBeInTheDocument();
  });

  it('merges persisted metas with store recordings', async () => {
    useAppStore.setState({ recordings: [recording('r1', { title: 'Store Rec' })] });
    (recordingStorage.listRecordings as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'r2', callType: 'audio', createdAt: NOW + 1, fileSize: 10, blobId: 'r2' },
    ]);
    render(<RecordingsScreen />);

    expect(await screen.findByText('recordings.untitled')).toBeInTheDocument();
    expect(screen.getByText('Store Rec')).toBeInTheDocument();
    await waitFor(() => expect(useAppStore.getState().recordings).toHaveLength(2));
  });

  it('filters recordings by search query', async () => {
    useAppStore.setState({
      recordings: [recording('r1', { title: 'Standup' }), recording('r2', { title: 'Lunch' })],
    });
    render(<RecordingsScreen />);
    const input = await screen.findByPlaceholderText('Search recordings...');

    fireEvent.change(input, { target: { value: 'stand' } });

    expect(screen.getByText('Standup')).toBeInTheDocument();
    expect(screen.queryByText('Lunch')).not.toBeInTheDocument();
  });

  it('marks a recording as favorite', async () => {
    useAppStore.setState({ recordings: [recording('r1')] });
    render(<RecordingsScreen />);
    fireEvent.click(await screen.findByLabelText('recordings.addToFavorites'));

    await waitFor(() => expect(useAppStore.getState().recordings[0].isFavorite).toBe(true));
    expect(screen.getByLabelText('recordings.removeFavorite')).toBeInTheDocument();
  });

  it('deletes a recording from storage and store', async () => {
    useAppStore.setState({ recordings: [recording('r1')] });
    render(<RecordingsScreen />);
    fireEvent.click(await screen.findByLabelText('recordings.delete'));

    await waitFor(() => expect(recordingStorage.deleteRecording).toHaveBeenCalledWith('r1'));
    await waitFor(() => expect(useAppStore.getState().recordings).toHaveLength(0));
  });

  it('opens the player for an audio recording', async () => {
    useAppStore.setState({ recordings: [recording('r1')] });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:screen');
    render(<RecordingsScreen />);
    fireEvent.click(await screen.findByLabelText('recordings.play'));

    expect(await screen.findByLabelText('common.close')).toBeInTheDocument();
    expect(callRecorderService.getRecordingBlob).toHaveBeenCalledWith('r1');
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('hides the play button for video recordings', async () => {
    useAppStore.setState({ recordings: [recording('r1', { callType: 'video', mimeType: 'video/webm' })] });
    render(<RecordingsScreen />);

    expect(await screen.findByLabelText('recordings.export')).toBeInTheDocument();
    expect(screen.queryByLabelText('recordings.play')).not.toBeInTheDocument();
  });

  it('exports a recording with its title', async () => {
    useAppStore.setState({ recordings: [recording('r1', { title: 'Standup' })] });
    render(<RecordingsScreen />);
    fireEvent.click(await screen.findByLabelText('recordings.export'));

    expect(callRecorderService.exportRecording).toHaveBeenCalledWith('r1', 'Standup');
  });

  it('calls onBack from the header', () => {
    const onBack = vi.fn();
    render(<RecordingsScreen onBack={onBack} />);
    fireEvent.click(screen.getByLabelText('common.back'));
    expect(onBack).toHaveBeenCalled();
  });

  it('closes the player when the playing recording is deleted', async () => {
    useAppStore.setState({ recordings: [recording('r1')] });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:screen');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    render(<RecordingsScreen />);
    fireEvent.click(await screen.findByLabelText('recordings.play'));
    await screen.findByLabelText('common.close');

    const deleteButtons = screen.getAllByLabelText('recordings.delete');
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => expect(revokeSpy).toHaveBeenCalledWith('blob:screen'));
    expect(screen.queryByLabelText('common.close')).not.toBeInTheDocument();
  });

  it('revokes the object URL when the player is closed', async () => {
    useAppStore.setState({ recordings: [recording('r1')] });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:screen');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    render(<RecordingsScreen />);
    fireEvent.click(await screen.findByLabelText('recordings.play'));
    fireEvent.click(await screen.findByLabelText('common.close'));

    expect(revokeSpy).toHaveBeenCalledWith('blob:screen');
  });
});
