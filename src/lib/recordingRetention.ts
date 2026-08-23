import { recordingStorage } from './recordingStorage';
import { useAppStore } from '../store';

/**
 * Remove recordings older than the user-configured retention window.
 * `recordingsRetentionDays <= 0` means "keep forever" — a no-op.
 */
export async function runRecordingRetention(): Promise<number> {
  const days = useAppStore.getState().recordingsRetentionDays;
  if (!days || days <= 0) return 0;
  try {
    return await recordingStorage.deleteOlderThan(days);
  } catch (err) {
    console.error('recording-retention: cleanup failed', err);
    return 0;
  }
}

/**
 * Run cleanup once on startup and then periodically (hourly) so old calls and
 * video calls are pruned without the user opening settings.
 */
export function startRecordingRetention(): () => void {
  void runRecordingRetention();
  const interval = setInterval(() => {
    void runRecordingRetention();
  }, 60 * 60 * 1000);
  return () => clearInterval(interval);
}
