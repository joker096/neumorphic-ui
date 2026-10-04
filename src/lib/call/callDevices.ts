import type { CallErrorReason, CallType, DeviceCheckResult } from './types';
import type { CallManagerInternals } from './callManagerInternals';

/**
 * Requests camera/microphone access. On failure emits `call:error` with a
 * user-facing reason and rethrows so callers keep their existing rejection flow.
 */
export async function acquireLocalStream(self: CallManagerInternals, callType: CallType): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType !== 'audio',
    });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    const reason: CallErrorReason =
      name === 'NotAllowedError'
        ? 'permission'
        : name === 'NotFoundError'
          ? 'no-device'
          : name === 'NotReadableError' || name === 'OverconstrainedError'
            ? 'device-busy'
            : 'unknown';
    self.emit('call:error', { reason });
    throw err;
  }
}

/**
 * Reports which media devices are available. Used before starting a call so
 * a missing microphone/camera is caught before the peer is rung.
 */
export async function checkDevices(): Promise<DeviceCheckResult> {
  const md = navigator.mediaDevices;
  if (!md) return { supported: false, hasAudio: false, hasVideo: false };
  try {
    const devices = await md.enumerateDevices();
    return {
      supported: true,
      hasAudio: devices.some((d) => d.kind === 'audioinput'),
      hasVideo: devices.some((d) => d.kind === 'videoinput'),
    };
  } catch {
    // Enumeration can fail before permission is granted; fall through so
    // getUserMedia surfaces the real error.
    return { supported: true, hasAudio: true, hasVideo: true };
  }
}

/**
 * Blocks the call start when the required devices are missing. Emits
 * `call:error` and throws so callers keep their rejection flow.
 */
export async function assertDevicesAvailable(self: CallManagerInternals, callType: CallType): Promise<void> {
  const md = navigator.mediaDevices;
  if (!md) {
    self.emit('call:error', { reason: 'unknown' });
    throw new DOMException('Media devices unsupported', 'UnknownError');
  }
  let devices: MediaDeviceInfo[];
  try {
    devices = await md.enumerateDevices();
  } catch {
    return;
  }
  if (devices.length === 0) return; // can't determine without permission — getUserMedia decides
  const hasAudio = devices.some((d) => d.kind === 'audioinput');
  const hasVideo = devices.some((d) => d.kind === 'videoinput');
  if (!hasAudio || (callType !== 'audio' && !hasVideo)) {
    self.emit('call:error', { reason: 'no-device' });
    throw new DOMException('Required device missing', 'NotFoundError');
  }
}

/**
 * Requests a camera track for an in-call audio→video switch. The companion
 * audio track from the request is stopped so only the live one remains.
 */
export async function acquireVideoTrack(self: CallManagerInternals): Promise<MediaStreamTrack | null> {
  const stream = await acquireLocalStream(self, 'video');
  const videoTrack = stream.getVideoTracks()[0];
  stream.getTracks().forEach((t) => {
    if (t.kind !== 'video') t.stop();
  });
  return videoTrack ?? null;
}
