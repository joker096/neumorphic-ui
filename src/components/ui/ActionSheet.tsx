import { motion, AnimatePresence } from 'motion/react';

interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  onClick: () => void;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: ActionSheetAction[];
  cancelLabel?: string;
}

export function ActionSheet({ isOpen, onClose, title, message, actions, cancelLabel = 'Cancel' }: ActionSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-[var(--space-5)] px-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-[var(--secondary-system-bg)]"
          >
            {title && (
              <div className="px-4 pt-4 pb-2 text-center">
                <div className="text-[13px] font-semibold text-[var(--system-gray)]">{title}</div>
                {message && <div className="text-[12px] text-[var(--system-gray)] mt-1">{message}</div>}
              </div>
            )}
            <div className="px-2 py-1 space-y-[1px]">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => { action.onClick(); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[17px] font-normal text-center justify-center rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
                >
                  {action.icon}
                  <span className={action.destructive ? 'text-red-500' : ''}>{action.label}</span>
                </button>
              ))}
            </div>
            <div className="px-2 pb-2 pt-1">
              <button
                onClick={onClose}
                className="w-full py-3.5 text-[17px] font-semibold text-center rounded-lg bg-[var(--system-background)] hover:opacity-80 transition-opacity"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
