import { Delete } from 'lucide-react';
import styles from './Keypad.module.css';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  /** Hide the fake home indicator when the keypad sits above another bar. */
  showHomeIndicator?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0'] as const;

export function Keypad({ onDigit, onBackspace, showHomeIndicator = true }: KeypadProps) {
  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        {KEYS.map((key) =>
          key === '*' ? (
            <span key="star" className={styles.deadKey} aria-hidden="true">
              *
            </span>
          ) : (
            <button
              key={key}
              type="button"
              className={styles.key}
              onClick={() => onDigit(key)}
              aria-label={key}
            >
              {key}
            </button>
          ),
        )}
        <button type="button" className={styles.key} onClick={onBackspace} aria-label="Delete digit">
          <Delete size={24} />
        </button>
      </div>
      {showHomeIndicator ? <span className={styles.homeIndicator} aria-hidden="true" /> : null}
    </div>
  );
}
