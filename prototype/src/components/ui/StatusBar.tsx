import { BatteryFull, Signal, Wifi } from 'lucide-react';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  tone?: 'default' | 'on-primary';
}

/** Fake iOS status bar (spec §3): fixed 9:41, signal, wifi, battery. */
export function StatusBar({ tone = 'default' }: StatusBarProps) {
  return (
    <div className={styles.root} data-tone={tone} aria-hidden="true">
      <span className={styles.time}>9:41</span>
      <span className={styles.icons}>
        <Signal size={16} strokeWidth={2.2} />
        <Wifi size={16} strokeWidth={2.2} />
        <BatteryFull size={22} strokeWidth={1.6} />
      </span>
    </div>
  );
}
