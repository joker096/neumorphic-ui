import type { ChangeEvent } from 'react';
import { Camera, Mic, Paperclip, SendHorizontal } from 'lucide-react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  onAttach?: () => void;
  onCamera?: () => void;
  placeholder?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onAttach,
  onCamera,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const hasText = value.trim().length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value);

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <input
          className={styles.input}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Message"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && hasText) onSend?.();
          }}
        />
        {onAttach && (
          <button type="button" className={styles.icon} onClick={onAttach} aria-label="Attach">
            <Paperclip size={20} strokeWidth={1.75} />
          </button>
        )}
        {onCamera && (
          <button type="button" className={styles.icon} onClick={onCamera} aria-label="Open camera">
            <Camera size={20} strokeWidth={1.75} />
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.action}
        onClick={() => (hasText ? onSend?.() : undefined)}
        aria-label={hasText ? 'Send message' : 'Record voice message'}
        disabled={!hasText && !onSend}
      >
        {hasText ? <SendHorizontal size={20} strokeWidth={2} /> : <Mic size={20} strokeWidth={2} />}
      </button>
    </div>
  );
}
