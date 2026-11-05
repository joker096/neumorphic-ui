import { lazy, Suspense } from 'react';
import { SMALL_SPINNER_CLASS } from '../ui/spinnerClasses';

const LazyLiveVoiceRecorder = lazy(() => import('../LiveVoiceRecorder').then(m => ({ default: m.LiveVoiceRecorder })));
const LazyLiveVideoRecorder = lazy(() => import('../LiveVideoRecorder').then(m => ({ default: m.LiveVideoRecorder })));

interface DmRecorderSlotsProps {
  showVideoRecorder: boolean;
  recordingVoice: boolean;
  onStopVideo: () => void;
  onStopVoice: () => void;
  onVoiceError: (msg: string) => void;
  sendVideoNote?: (file: File) => void;
  sendVoiceMessage?: (url: string, dur: string, blob?: Blob) => void;
}

export function DmRecorderSlots({
  showVideoRecorder,
  recordingVoice,
  onStopVideo,
  onStopVoice,
  onVoiceError,
  sendVideoNote,
  sendVoiceMessage,
}: DmRecorderSlotsProps) {
  return (
    <>
      {showVideoRecorder ? (
        <div className="px-3 pb-2">
          <Suspense fallback={null}>
            <LazyLiveVideoRecorder
              onCancel={onStopVideo}
              onPermissionDenied={(msg: string) => {
                onStopVideo();
                onVoiceError(msg);
              }}
              onSend={(url, _dur, blob) => {
                onStopVideo();
                if (sendVideoNote) {
                  const file = new File([blob], 'video-note.webm', { type: blob.type || 'video/webm' });
                  sendVideoNote(file);
                }
                URL.revokeObjectURL(url);
              }}
            />
          </Suspense>
        </div>
      ) : null}

      {recordingVoice ? (
        <div className="px-3 pb-2">
          <Suspense fallback={<span aria-hidden="true" className={SMALL_SPINNER_CLASS} data-testid="lazy-voice-fallback" />}>
            <LazyLiveVoiceRecorder
              onCancel={onStopVoice}
              onPermissionDenied={(msg: string) => {
                onStopVoice();
                onVoiceError(msg);
              }}
              onSend={(url, dur, blob) => {
                onStopVoice();
                if (sendVoiceMessage) sendVoiceMessage(url, dur, blob);
                else onVoiceError('');
              }}
              holdToRecord
            />
          </Suspense>
        </div>
      ) : null}
    </>
  );
}
