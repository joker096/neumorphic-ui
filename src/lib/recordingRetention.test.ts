import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordingStorage } from './recordingStorage';
import { runRecordingRetention, startRecordingRetention } from './recordingRetention';

const mockState = vi.hoisted(() => ({
  recordingsRetentionDays: 0 as number | undefined,
}));

vi.mock('./recordingStorage', () => ({
  recordingStorage: { deleteOlderThan: vi.fn() },
}));

vi.mock('../store', () => ({
  useAppStore: { getState: () => mockState },
}));

const deleteOlderThan = recordingStorage.deleteOlderThan as ReturnType<typeof vi.fn>;

describe('runRecordingRetention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.recordingsRetentionDays = 0;
  });

  it('is a no-op when retention days is 0', async () => {
    const removed = await runRecordingRetention();
    expect(removed).toBe(0);
    expect(deleteOlderThan).not.toHaveBeenCalled();
  });

  it('is a no-op when retention days is missing', async () => {
    mockState.recordingsRetentionDays = undefined;
    const removed = await runRecordingRetention();
    expect(removed).toBe(0);
    expect(deleteOlderThan).not.toHaveBeenCalled();
  });

  it('deletes recordings older than the window', async () => {
    mockState.recordingsRetentionDays = 7;
    deleteOlderThan.mockResolvedValue(4);
    const removed = await runRecordingRetention();
    expect(removed).toBe(4);
    expect(deleteOlderThan).toHaveBeenCalledWith(7);
  });

  it('returns 0 and logs when storage fails', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockState.recordingsRetentionDays = 7;
    deleteOlderThan.mockRejectedValue(new Error('boom'));
    const removed = await runRecordingRetention();
    expect(removed).toBe(0);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('startRecordingRetention', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs immediately, then hourly, and stops on unsubscribe', async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockState.recordingsRetentionDays = 7;
    deleteOlderThan.mockResolvedValue(0);

    const stop = startRecordingRetention();
    await vi.advanceTimersByTimeAsync(0);
    expect(deleteOlderThan).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    expect(deleteOlderThan).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(60 * 60 * 1000 * 2);
    expect(deleteOlderThan).toHaveBeenCalledTimes(2);
  });
});
