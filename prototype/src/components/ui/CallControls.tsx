import { Mic, MicOff, Phone, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { cx } from '../../utils/cx';
import styles from './CallControls.module.css';

interface CallControlsProps {
  variant: 'voice' | 'video';
  muted: boolean;
  speaker: boolean;
  cameraOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
}

export function CallControls({
  variant,
  muted,
  speaker,
  cameraOn,
  onToggleMute,
  onToggleSpeaker,
  onToggleCamera,
  onEnd,
}: CallControlsProps) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={cx(styles.btn, speaker && styles.active)}
        onClick={onToggleSpeaker}
        aria-pressed={speaker}
        aria-label={speaker ? 'Turn speaker off' : 'Turn speaker on'}
      >
        {speaker ? <Volume2 size={22} strokeWidth={1.75} /> : <VolumeX size={22} strokeWidth={1.75} />}
      </button>

      <button
        type="button"
        className={cx(styles.btn, muted && styles.active)}
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {muted ? <MicOff size={22} strokeWidth={1.75} /> : <Mic size={22} strokeWidth={1.75} />}
      </button>

      <button
        type="button"
        className={cx(styles.btn, variant === 'video' ? !cameraOn && styles.active : false)}
        onClick={onToggleCamera}
        aria-pressed={variant === 'video' ? !cameraOn : undefined}
        aria-label={variant === 'video' ? (cameraOn ? 'Turn camera off' : 'Turn camera on') : 'Switch to video call'}
      >
        {variant === 'video' && !cameraOn ? (
          <VideoOff size={22} strokeWidth={1.75} />
        ) : (
          <Video size={22} strokeWidth={1.75} />
        )}
      </button>

      <button type="button" className={cx(styles.btn, styles.end)} onClick={onEnd} aria-label="End call">
        <Phone size={22} strokeWidth={1.75} className={styles.endIcon} />
      </button>
    </div>
  );
}
