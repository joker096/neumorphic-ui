import { Check } from 'lucide-react';
import { cx } from '../../utils/cx';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className={styles.root}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={cx(styles.box, checked && styles.checked)} aria-hidden="true">
        {checked ? <Check size={14} strokeWidth={3} /> : null}
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  );
}
