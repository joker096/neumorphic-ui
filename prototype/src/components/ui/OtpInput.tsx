import { useEffect, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import styles from './OtpInput.module.css';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** PIN entry hides filled cells behind dots (spec §5, screen 11). */
  mask?: boolean;
  autoFocus?: boolean;
  label?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 4,
  mask = false,
  autoFocus = false,
  label = 'Verification code',
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const activeIndex = Math.min(value.length, length - 1);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const focusCell = (index: number) => {
    const next = Math.max(0, Math.min(index, length - 1));
    refs.current[next]?.focus();
  };

  const writeAt = (index: number, char: string) => {
    if (!/^\d$/.test(char)) return;
    const next =
      index >= value.length
        ? `${value}${char}`.slice(0, length)
        : `${value.slice(0, index)}${char}${value.slice(index + 1)}`.slice(0, length);
    onChange(next);
    focusCell(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (index === 0) {
        onChange(value.slice(0, -1));
        focusCell(0);
        return;
      }
      onChange(value.slice(0, Math.min(index, value.length)));
      focusCell(index - 1);
      return;
    }
    if (event.key === 'ArrowLeft') focusCell(index - 1);
    if (event.key === 'ArrowRight') focusCell(index + 1);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    event.preventDefault();
    onChange(digits);
    focusCell(digits.length);
  };

  return (
    <div className={styles.root} role="group" aria-label={label}>
      {Array.from({ length }, (_, index) => {
        const filled = index < value.length;
        const showDigit = filled && (!mask || index === activeIndex);
        const cellValue = showDigit ? (value[index] ?? '') : filled ? '•' : '';
        return (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            className={styles.cell}
            data-active={index === activeIndex || undefined}
            data-filled={filled || undefined}
            value={cellValue}
            onChange={(event) => writeAt(index, event.target.value.slice(-1))}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={() => focusCell(Math.min(value.length, index))}
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`${label} digit ${index + 1}`}
            maxLength={1}
          />
        );
      })}
    </div>
  );
}
