import { useState } from 'react';
import { Check, CheckCheck, Pause, Play } from 'lucide-react';
import { cx } from '../../utils/cx';
import styles from './ChatBubble.module.css';

export interface ChatBubbleVoice {
  duration: string;
  waveform: number[];
}

interface ChatBubbleProps {
  direction: 'in' | 'out';
  text?: string;
  time?: string;
  status?: 'sent' | 'delivered' | 'read';
  images?: string[];
  voice?: ChatBubbleVoice;
  selected?: boolean;
  grouped?: boolean;
  tail?: boolean;
  onImageClick?: (src: string) => void;
}

const ACTIVE_BARS = 9;

export function ChatBubble({
  direction,
  text,
  time,
  status,
  images,
  voice,
  selected = false,
  grouped = false,
  tail = true,
  onImageClick,
}: ChatBubbleProps) {
  const [playing, setPlaying] = useState(false);
  const out = direction === 'out';

  return (
    <div className={cx(styles.row, out ? styles.rowOut : styles.rowIn, grouped && styles.grouped, selected && styles.selected)}>
      <div
        className={cx(
          styles.bubble,
          out ? styles.out : styles.in,
          tail && (out ? styles.tailOut : styles.tailIn),
          !text && styles.bubbleMedia,
        )}
      >
        {images && images.length > 0 && (
          <div className={cx(styles.images, images.length === 1 ? styles.imagesSingle : styles.imagesGrid)}>
            {images.map((src) => (
              <button
                key={src}
                type="button"
                className={styles.image}
                onClick={() => onImageClick?.(src)}
                aria-label="Open photo"
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        {voice && (
          <div className={styles.voice}>
            <button
              type="button"
              className={styles.playBtn}
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? 'Pause voice message' : 'Play voice message'}
            >
              {playing ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
            </button>
            <div className={styles.wave} aria-hidden="true">
              {voice.waveform.map((h, i) => (
                <span
                  key={i}
                  className={cx(styles.bar, playing && i < ACTIVE_BARS && styles.barActive)}
                  style={{ height: `${Math.max(20, Math.min(100, h))}%` }}
                />
              ))}
            </div>
            <span className={styles.duration}>{voice.duration}</span>
          </div>
        )}

        {text && <p className={styles.text}>{text}</p>}

        {(time || status) && (
          <div className={styles.meta}>
            {time && <span>{time}</span>}
            {out && status && (
              <span className={styles.status} aria-label={`Message ${status}`}>
                {status === 'sent' ? <Check size={14} strokeWidth={2} /> : <CheckCheck size={14} strokeWidth={2} />}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
