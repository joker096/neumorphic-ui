import type { ReactNode } from 'react';
import styles from './PhoneFrame.module.css';

/** Centers the 375-wide app inside a phone shell on desktop; full-bleed on mobile. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.stage}>
      <div className={styles.frame}>{children}</div>
    </div>
  );
}
