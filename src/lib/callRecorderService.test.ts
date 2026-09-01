import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callRecorderService } from './callRecorderService';
import { recordingStorage } from './recordingStorage';
import { useAppStore } from '../store';

vi.mock('./recordingStorage', () => ({
  recordingStorage: {
    saveRecording: vi.fn(),
    getBlob: vi.fn(),
    deleteBlob: vi.fn(),
  },
}));

vi.mock('../store', () => ({
  useAppStore: { getState: vi.fn() },
}));

class MediaRecorderMock {
  static isTypeSupported = vi.fn((_t: string) => false);
  static last: MediaRecorderMock | null = null;
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
  }

  constructor(_stream: MediaStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
    MediaRecorderMock.last = this;
  }
}

const stream = {} as MediaStream;

function mockStore(overrides: Record<string, unknown> = {}) {
  const addRecording = vi.fn();
  (useAppStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
    saveAudioRecordings: true,
    saveVideoRecordings: true,
    recordings: [],
    addRecording,
    ...overrides,
  });
  return { addRecording };
}

describe('callRecorderService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    callRecorderService.discardRecording();
    MediaRecorderMock.isTypeSupported = vi.fn(() => false);
    MediaRecorderMock.last = null;
    vi.stubGlobal('MediaRecorder', MediaRecorderMock);
    mockStore();
    (recordingStorage.saveRecording as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (recordingStorage.getBlob as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  it('negotiates audio mime type', async () => {
    await callRecorderService.startRecording('r1', stream, false);
    expect(MediaRecorderMock.last?.mimeType).toBe('audio/webm');

    callRecorderService.discardRecording();
    MediaRecorderMock.isTypeSupported = vi.fn(() => true);
    await callRecorderService.startRecording('r2', stream, false);
    expect(MediaRecorderMock.last?.mimeType).toBe('audio/webm;codecs=opus');
    callRecorderService.discardRecording();
  });

  it('negotiates video mime type with vp9, vp8 and fallback', async () => {
    MediaRecorderMock.isTypeSupported = vi.fn(() => true);
    await callRecorderService.startRecording('r1', stream, true);
    expect(MediaRecorderMock.last?.mimeType).toBe('video/webm;codecs=vp9');
    callRecorderService.discardRecording();

    MediaRecorderMock.isTypeSupported = vi.fn((t: string) => t.includes('vp8'));
    await callRecorderService.startRecording('r2', stream, true);
    expect(MediaRecorderMock.last?.mimeType).toBe('video/webm;codecs=vp8');
    callRecorderService.discardRecording();

    MediaRecorderMock.isTypeSupported = vi.fn(() => false);
    await callRecorderService.startRecording('r3', stream, true);
    expect(MediaRecorderMock.last?.mimeType).toBe('video/webm');
  });

  it('returns false and warns when already recording', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await callRecorderService.startRecording('r1', stream, false)).toBe(true);
    expect(await callRecorderService.startRecording('r2', stream, false)).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    callRecorderService.discardRecording();
    warnSpy.mockRestore();
  });

  it('returns false when MediaRecorder construction fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'MediaRecorder',
      Object.assign(
        class {
          constructor() {
            throw new Error('boom');
          }
        },
        { isTypeSupported: () => false },
      ),
    );
    expect(await callRecorderService.startRecording('r1', stream, false)).toBe(false);
    expect(callRecorderService.isRecording).toBe(false);
    errSpy.mockRestore();
  });

  it('notifies subscribers on start and discard', async () => {
    const handler = vi.fn();
    const unsub = callRecorderService.onStateChange(handler);

    await callRecorderService.startRecording('r1', stream, false);
    expect(handler).toHaveBeenLastCalledWith(true);

    callRecorderService.discardRecording();
    expect(handler).toHaveBeenLastCalledWith(false);
    expect(handler).toHaveBeenCalledTimes(2);

    unsub();
    callRecorderService.discardRecording();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('stopRecording stops the media recorder and leaves recording state', async () => {
    await callRecorderService.startRecording('r1', stream, false);
    expect(callRecorderService.isRecording).toBe(true);
    const mr = MediaRecorderMock.last!;
    const stopSpy = vi.spyOn(mr, 'stop');

    callRecorderService.stopRecording();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(callRecorderService.isRecording).toBe(false);
  });

  it('saves chunks and adds to store on stop', async () => {
    const { addRecording } = mockStore();
    await callRecorderService.startRecording('r1', stream, false);
    const mr = MediaRecorderMock.last!;
    mr.ondataavailable!({ data: new Blob(['abc']) });
    mr.ondataavailable!({ data: new Blob(['def']) });
    mr.onstop!();

    await vi.waitFor(() => expect(addRecording).toHaveBeenCalled());
    const saveMock = recordingStorage.saveRecording as ReturnType<typeof vi.fn>;
    expect(saveMock).toHaveBeenCalledTimes(1);
    const [meta, blob] = saveMock.mock.calls[0] as [
      { id: string; callType: string; blobId: string },
      Blob,
    ];
    expect(meta.id).toBe('r1');
    expect(meta.callType).toBe('audio');
    expect(meta.blobId).toBe('r1');
    expect(blob.size).toBe(6);
    expect(addRecording).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1', callType: 'audio', fileSize: 6 }));
    expect(callRecorderService.isRecording).toBe(false);
  });

  it('discards when no chunks were captured', async () => {
    mockStore();
    await callRecorderService.startRecording('r1', stream, false);
    const mr = MediaRecorderMock.last!;
    mr.onstop!();
    await Promise.resolve();

    expect(recordingStorage.saveRecording).not.toHaveBeenCalled();
    expect(callRecorderService.isRecording).toBe(false);
  });

  it('discards when audio recording saving is disabled', async () => {
    mockStore({ saveAudioRecordings: false });
    await callRecorderService.startRecording('r1', stream, false);
    const mr = MediaRecorderMock.last!;
    mr.ondataavailable!({ data: new Blob(['abc']) });
    mr.onstop!();
    await Promise.resolve();

    expect(recordingStorage.saveRecording).not.toHaveBeenCalled();
    expect(callRecorderService.isRecording).toBe(false);
  });

  it('skips store add when the recording is already listed', async () => {
    const { addRecording } = mockStore({ recordings: [{ id: 'r1' }] });
    await callRecorderService.startRecording('r1', stream, false);
    const mr = MediaRecorderMock.last!;
    mr.ondataavailable!({ data: new Blob(['abc']) });
    mr.onstop!();

    await vi.waitFor(() =>
      expect(recordingStorage.saveRecording).toHaveBeenCalled(),
    );
    expect(addRecording).not.toHaveBeenCalled();
    expect(callRecorderService.isRecording).toBe(false);
  });

  it('marks video recordings as video on completion', async () => {
    const { addRecording } = mockStore();
    MediaRecorderMock.isTypeSupported = vi.fn(() => true);
    await callRecorderService.startRecording('r1', stream, true);
    const mr = MediaRecorderMock.last!;
    mr.ondataavailable!({ data: new Blob(['abc']) });
    mr.onstop!();

    await vi.waitFor(() => expect(addRecording).toHaveBeenCalled());
    expect(addRecording).toHaveBeenCalledWith(expect.objectContaining({ callType: 'video', mimeType: 'video/webm' }));
  });

  it('getRecordingBlob delegates to storage', async () => {
    const blob = new Blob(['x']);
    (recordingStorage.getBlob as ReturnType<typeof vi.fn>).mockResolvedValue(blob);
    expect(await callRecorderService.getRecordingBlob('r1')).toBe(blob);
  });

  it('deleteRecording delegates to storage', async () => {
    await callRecorderService.deleteRecording('r1');
    expect(recordingStorage.deleteBlob).toHaveBeenCalledWith('r1');
  });

  it('exportRecording downloads the blob', async () => {
    const blob = new Blob(['x']);
    (recordingStorage.getBlob as ReturnType<typeof vi.fn>).mockResolvedValue(blob);
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await callRecorderService.exportRecording('r1', 'My Call');

    expect(createSpy).toHaveBeenCalledWith(blob);
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake');
  });

  it('exportRecording does nothing when the blob is missing', async () => {
    const createSpy = vi.spyOn(URL, 'createObjectURL');
    (recordingStorage.getBlob as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await callRecorderService.exportRecording('r1', 'My Call');

    expect(createSpy).not.toHaveBeenCalled();
  });
});
