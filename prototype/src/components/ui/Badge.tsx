import styles from './Badge.module.css';

interface BadgeProps {
  count: number;
  /** Pills grow for two digits; spec calls for a 20px circle otherwise. */
  max?: number;
  className?: string;
}

export function Badge({ count, max = 99, className }: BadgeProps) {
  if (!Number.isFinite(count) || count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);
  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')} data-testid="badge">
      {label}
    </span>
  );
}
