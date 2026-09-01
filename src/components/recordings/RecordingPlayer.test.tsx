import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { RecordingPlayer } from './RecordingPlayer';
import type { CallRecording } from '../../lib/callRecorderService';

vi.mock('motion/react', () => ({ motion: { div: 'div', button: 'button' } }));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key),
  }),
}));

const recording: CallRecording = {
  id: 'r1',
  callId: 'r1',
  callType: 'audio',
  participants: [
    { userId: 'u1', displayName: 'Alice' },
    { userId: 'u2', displayName: 'Bob' },
  ],
  startedAt: 0,
  duration: 0,
  recordingDuration: 0,
  fileSize: 0,
  mimeType: 'audio/webm',
  blobId: 'r1',
  isFavorite: false,
  tags: [],
  createdAt: 0,
  title: 'Standup',
};

let playSpy: MockInstance<() => Promise<void>>;
let pauseSpy: MockInstance<() => void>;

function renderPlayer(props: Partial<{ onClose: () => void; onDelete: (id: string) => void; onExport: (id: string, title: string) => void }> = {}) {
  const onClose = vi.fn();
  const onDelete = vi.fn();
  const onExport = vi.fn();
  render(
    <RecordingPlayer
      recording={recording}
      blobUrl="blob:test"
      onClose={onClose}
      onDelete={onDelete}
      onExport={onExport}
      {...props}
    />,
  );
  return { onClose, onDelete, onExport, audio: document.querySelector('audio') as HTMLAudioElement };
}

describe('RecordingPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title, participants and auto-plays', () => {
    const { audio } = renderPlayer();
    expect(screen.getByText('Standup')).toBeInTheDocument();
    expect(screen.getByText('Alice, Bob')).toBeInTheDocument();
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(audio).toHaveAttribute('src', 'blob:test');
  });

  it('calls onClose from the close button', () => {
    const { onClose } = renderPlayer();
    fireEvent.click(screen.getByLabelText('common.close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click but not on card click', () => {
    const { onClose } = renderPlayer();
    fireEvent.click(screen.getByText('Standup'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('.fixed') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pauses and resumes playback', () => {
    const { audio } = renderPlayer();
    fireEvent.click(screen.getByLabelText('systemPlayer.pause'));
    expect(pauseSpy).toHaveBeenCalled();
    fireEvent.pause(audio);

    expect(screen.getByLabelText('systemPlayer.play')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('systemPlayer.play'));
    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it('seeks with the range input', () => {
    const { audio } = renderPlayer();
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 0, writable: true });
    Object.defineProperty(audio, 'duration', { configurable: true, value: 120 });
    fireEvent.loadedMetadata(audio);
    const seek = screen.getAllByRole('slider')[0];
    fireEvent.change(seek, { target: { value: '30' } });

    expect(audio.currentTime).toBe(30);
    expect(screen.getByText('0:30')).toBeInTheDocument();
  });

  it('skips ±15s and clamps to the duration', () => {
    const { audio } = renderPlayer();
    Object.defineProperty(audio, 'duration', { configurable: true, value: 120 });
    fireEvent.loadedMetadata(audio);
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 30, writable: true });

    fireEvent.click(screen.getByText('+15s'));
    expect(audio.currentTime).toBe(45);
    fireEvent.click(screen.getByText('-15s'));
    expect(audio.currentTime).toBe(30);
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 5, writable: true });
    fireEvent.click(screen.getByText('-15s'));
    expect(audio.currentTime).toBe(0);
  });

  it('cycles through playback rates', () => {
    const { audio } = renderPlayer();
    fireEvent.click(screen.getByText('1x'));
    expect(audio.playbackRate).toBe(1.25);
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    fireEvent.click(screen.getByText('1.25x'));
    expect(screen.getByText('1.5x')).toBeInTheDocument();
  });

  it('mutes and unmutes via the volume slider', () => {
    const { audio } = renderPlayer();
    fireEvent.click(screen.getByLabelText('systemPlayer.mute'));

    expect(screen.getByLabelText('systemPlayer.unmute')).toBeInTheDocument();
    expect(screen.getAllByRole('slider')[1]).toHaveValue('0');
    fireEvent.change(screen.getAllByRole('slider')[1], { target: { value: '0.5' } });
    expect(screen.getByLabelText('systemPlayer.mute')).toBeInTheDocument();
    expect(audio.volume).toBe(0.5);
  });

  it('exports and deletes the recording', () => {
    const { onExport, onDelete } = renderPlayer();
    fireEvent.click(screen.getByLabelText('recordings.export'));
    expect(onExport).toHaveBeenCalledWith('r1', 'Standup');
    fireEvent.click(screen.getByLabelText('recordings.delete'));
    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('shows the play button after the audio ends', () => {
    const { audio } = renderPlayer();
    fireEvent.ended(audio);
    expect(screen.getByLabelText('systemPlayer.play')).toBeInTheDocument();
  });
});
