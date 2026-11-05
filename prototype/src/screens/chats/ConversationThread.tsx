import { useEffect, useRef, useState } from 'react';
import { Copy, Forward, Reply, Star, Trash2, X } from 'lucide-react';
import { ChatBubble } from '../../components/ui/ChatBubble';
import { useChatsStore } from '../../store/chats';
import { cx } from '../../utils/cx';
import styles from './ConversationThread.module.css';

interface ConversationThreadProps {
  chatId: string;
  onImageClick: (src: string) => void;
}

export function ConversationThread({ chatId, onImageClick }: ConversationThreadProps) {
  const messages = useChatsStore((s) => s.messages[chatId] ?? []);
  const [selected, setSelected] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const timer = useRef<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, chatId]);

  const startPress = (id: string) => {
    timer.current = window.setTimeout(() => setSelected([id]), 420);
  };

  const endPress = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  const tap = (id: string) => {
    if (selected.length === 0) return;
    setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  };

  const visible = messages.filter((message) => !hidden.includes(message.id));
  const selectionMode = selected.length > 0;

  return (
    <div className={styles.wrap}>
      {selectionMode && (
        <div className={styles.selectionBar}>
          <button type="button" className={styles.barIcon} onClick={() => setSelected([])} aria-label="Cancel selection">
            <X size={20} strokeWidth={2} />
          </button>
          <span className={styles.counter}>{selected.length}</span>
          <div className={styles.barActions}>
            <button type="button" className={styles.barIcon} onClick={() => setSelected([])} aria-label="Reply">
              <Reply size={19} strokeWidth={1.75} />
            </button>
            <button type="button" className={styles.barIcon} onClick={() => setSelected([])} aria-label="Star">
              <Star size={19} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className={styles.barIcon}
              onClick={() => {
                const text = visible.filter((m) => selected.includes(m.id)).map((m) => m.text ?? '').join('\n');
                void navigator.clipboard?.writeText(text).catch(() => undefined);
                setSelected([]);
              }}
              aria-label="Copy"
            >
              <Copy size={19} strokeWidth={1.75} />
            </button>
            <button type="button" className={styles.barIcon} onClick={() => setSelected([])} aria-label="Forward">
              <Forward size={19} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className={styles.barIcon}
              onClick={() => {
                setHidden((list) => [...list, ...selected]);
                setSelected([]);
              }}
              aria-label="Delete"
            >
              <Trash2 size={19} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      <div className={styles.thread}>
        <div className={styles.day}>
          <span>Today</span>
        </div>
        {visible.map((message, index) => {
          const previous = visible[index - 1];
          const grouped = previous !== undefined && previous.from === message.from;
          return (
            <div
              key={message.id}
              onPointerDown={() => startPress(message.id)}
              onPointerUp={endPress}
              onPointerLeave={endPress}
              onContextMenu={(event) => event.preventDefault()}
              onClick={() => tap(message.id)}
              className={cx(styles.holder, message.from === 'me' && styles.holderOut)}
            >
              <ChatBubble
                direction={message.from === 'me' ? 'out' : 'in'}
                text={message.text}
                time={message.time}
                status={message.status}
                images={message.images}
                voice={message.voice}
                grouped={grouped}
                selected={selected.includes(message.id)}
                onImageClick={onImageClick}
              />
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
    </div>
  );
}

