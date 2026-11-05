import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 32 | 40 | 48 | 56 | 88 | 120;

interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const initialsOf = (name?: string): string =>
  name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
    : '';

/** Photo / initials / grey silhouette. Deliberately has no online dot (spec §3). */
export function Avatar({ src, name, size = 48, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const style: CSSProperties = { width: size, height: size, fontSize: Math.round(size * 0.34) };
  const classes = [styles.root, className].filter(Boolean).join(' ');
  const showPhoto = Boolean(src) && !failed;

  return (
    <span className={classes} style={style} data-size={size}>
      {showPhoto ? (
        <img
          className={styles.image}
          src={src}
          alt={name ?? 'Avatar'}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : initialsOf(name) ? (
        <span className={styles.initials} aria-hidden="true">
          {initialsOf(name)}
        </span>
      ) : (
        <UserIcon className={styles.placeholder} size={Math.round(size * 0.45)} aria-hidden="true" />
      )}
    </span>
  );
}
