import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Tabs, type TabItem } from './Tabs';
import { StatusBar } from './StatusBar';
import { cx } from '../../utils/cx';
import styles from './AppBar.module.css';

interface AppBarProps {
  /** `blue` = the solid primary header used on chat screens, `plain` = white/dark auth header. */
  tone?: 'blue' | 'plain';
  onBack?: () => void;
  left?: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  showStatusBar?: boolean;
  className?: string;
}

export function AppBar({
  tone = 'plain',
  onBack,
  left,
  title,
  subtitle,
  right,
  tabs,
  activeTab,
  onTabChange,
  showStatusBar = true,
  className,
}: AppBarProps) {
  return (
    <header className={cx(styles.bar, tone === 'blue' ? styles.blue : styles.plain, className)}>
      {showStatusBar && <StatusBar tone={tone === 'blue' ? 'on-primary' : 'default'} />}
      <div className={styles.row}>
        {onBack && (
          <button
            type="button"
            className={styles.back}
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowLeft size={24} strokeWidth={1.75} />
          </button>
        )}
        {left}
        <div className={styles.titles}>
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        <div className={styles.right}>{right}</div>
      </div>
      {tabs && activeTab !== undefined && onTabChange && (
        <Tabs tabs={tabs} value={activeTab} onChange={onTabChange} tone={tone === 'blue' ? 'primary' : 'default'} />
      )}
    </header>
  );
}
