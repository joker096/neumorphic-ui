import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

/** 44×44 hit area around a 44×26 track (spec §7). */
export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.root}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track} data-checked={checked || undefined}>
        <span className={styles.knob} />
      </span>
    </button>
  );
}
