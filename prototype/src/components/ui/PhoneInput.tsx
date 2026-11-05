import { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '../../utils/cx';
import styles from './PhoneInput.module.css';

interface PhoneCountry {
  id: string;
  flag: string;
  code: string;
}

const COUNTRIES: PhoneCountry[] = [
  { id: 'us', flag: '🇺🇸', code: '1' },
  { id: 'gb', flag: '🇬🇧', code: '44' },
  { id: 'de', flag: '🇩🇪', code: '49' },
];

/** Groups national digits the way the mock shows them: 111 467 378 399. */
function formatNationalDigits(digits: string): string {
  return digits
    .replace(/\D/g, '')
    .replace(/(\d{3})(?=\d)/g, '$1 ')
    .trim();
}

interface PhoneInputProps {
  /** National digits only, e.g. `111467378399`. */
  value: string;
  onChange: (digits: string) => void;
  autoFocus?: boolean;
  error?: string;
  /** Lets the auth screens reveal the in-app keypad instead of the OS keyboard. */
  onFocusChange?: (focused: boolean) => void;
}

export function PhoneInput({ value, onChange, autoFocus, error, onFocusChange }: PhoneInputProps) {
  const [country, setCountry] = useState<PhoneCountry>(COUNTRIES[0] as PhoneCountry);
  const selectRef = useRef<HTMLSelectElement>(null);
  const display = useMemo(() => formatNationalDigits(value), [value]);

  return (
    <div className={styles.root}>
      <div className={cx(styles.field, error && styles.invalid)}>
        <button
          type="button"
          className={styles.country}
          onClick={() => selectRef.current?.focus()}
          aria-label="Country code"
        >
          <span className={styles.flag} aria-hidden="true">
            {country.flag}
          </span>
          <ChevronDown size={16} className={styles.chevron} aria-hidden="true" />
        </button>
        <select
          ref={selectRef}
          className={styles.select}
          value={country.id}
          aria-label="Country"
          onChange={(event) => {
            const next = COUNTRIES.find((item) => item.id === event.target.value);
            if (next) setCountry(next);
          }}
        >
          {COUNTRIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.flag} +{item.code}
            </option>
          ))}
        </select>
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.code}>+{country.code}</span>
        <input
          className={styles.input}
          value={display}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 12))}
          placeholder="+1 000 000 000"
          aria-label="Phone number"
          inputMode="numeric"
          autoComplete="tel"
          autoFocus={autoFocus}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
        />
      </div>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
