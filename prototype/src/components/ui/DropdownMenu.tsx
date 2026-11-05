import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cx } from '../../utils/cx';
import styles from './DropdownMenu.module.css';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
}

interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
  top?: number;
}

export function DropdownMenu({ open, onClose, items, onSelect, align = 'right', top = 52 }: DropdownMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={styles.root}>
          <div className={styles.overlay} onClick={onClose} />
          <motion.ul
            role="menu"
            className={cx(styles.menu, align === 'right' ? styles.right : styles.left)}
            style={{ top }}
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={cx(styles.item, item.danger && styles.danger)}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  >
                    {Icon && <Icon size={18} strokeWidth={1.75} />}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        </div>
      )}
    </AnimatePresence>
  );
}
