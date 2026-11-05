import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Input.module.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Rendered as the placeholder so the visual language stays label-light. */
  label: string;
  icon?: ReactNode;
  error?: string;
}

export function Input({ label, icon, error, className, id, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={styles.root}>
      <div className={cx(styles.field, error && styles.invalid, className)}>
        <input
          {...rest}
          id={inputId}
          className={styles.input}
          placeholder={label}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      {error ? (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
