import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** `primary` sits on the blue AppBar, `default` on a white surface. */
  tone?: 'primary' | 'default';
}

export function Tabs({ tabs, value, onChange, tone = 'primary' }: TabsProps) {
  return (
    <div className={styles.root} role="tablist" data-tone={tone}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={styles.tab}
            data-active={active || undefined}
            onClick={() => onChange(tab.id)}
          >
            <span className={styles.label}>{tab.label}</span>
            {tab.badge ? <span className={styles.badge}>{tab.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
