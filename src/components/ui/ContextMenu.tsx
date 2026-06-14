import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  shortcut?: string;
  onClick: () => void;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ isOpen, position, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ left: position.x, top: position.y }}
          className="fixed z-[60] min-w-[180px] py-1 rounded-xl bg-[var(--secondary-system-bg)] border border-[var(--separator)] shadow-2xl overflow-hidden"
        >
          {items.map((item, i) => (
            <button
              key={i}
              disabled={item.disabled}
              onClick={() => { item.onClick(); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[14px] text-left transition-colors ${
                item.destructive
                  ? 'text-red-500 hover:bg-red-500/10'
                  : item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/10 active:bg-white/20'
              }`}
            >
              {item.icon && <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-[11px] text-[var(--system-gray)] ml-4">{item.shortcut}</span>
              )}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
