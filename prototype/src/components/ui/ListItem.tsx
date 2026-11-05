import type { ReactNode } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { cx } from '../../utils/cx';
import styles from './ListItem.module.css';

interface ListItemProps {
  name: string;
  preview?: string;
  avatar?: string;
  time?: string;
  unread?: number;
  /** double check rendered next to the time for outgoing last messages */
  status?: 'sent' | 'delivered' | 'read';
  isGroup?: boolean;
  onClick?: () => void;
  right?: ReactNode;
  className?: string;
}

export function ListItem({
  name,
  preview,
  avatar,
  time,
  unread,
  status,
  isGroup,
  onClick,
  right,
  className,
}: ListItemProps) {
  const content = (
    <>
      <Avatar src={avatar} name={name} size={48} />
      <div className={styles.body}>
        <div className={styles.line}>
          <span className={styles.name}>{name}</span>
          {time && <span className={styles.time}>{time}</span>}
        </div>
        <div className={styles.line}>
          <span className={cx(styles.preview, status && styles.previewWithStatus)}>
            {status && (
              <span className={styles.checks} aria-hidden="true">
                {status === 'sent' ? <Check size={14} strokeWidth={2} /> : <CheckCheck size={14} strokeWidth={2} />}
              </span>
            )}
            {preview}
          </span>
          {unread && unread > 0 ? <Badge count={unread} /> : right ?? null}
        </div>
      </div>
    </>
  );

  if (!onClick) {
    return <div className={cx(styles.item, className)}>{content}</div>;
  }

  return (
    <button
      type="button"
      className={cx(styles.item, className)}
      onClick={onClick}
      aria-label={isGroup ? `${name}, group chat` : name}
    >
      {content}
    </button>
  );
}
