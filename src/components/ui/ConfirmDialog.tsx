import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../../lib/i18n';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  theme?: 'light' | 'dark';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  theme = 'dark',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDark = theme === 'dark';
  const { t } = useI18n();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel, onConfirm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 border ${
              isDark ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`confirm-modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-bold mb-2 text-[var(--text-primary)]">{title}</h3>
            <p id={`confirm-modal-title-${title.replace(/\s+/g, '-').toLowerCase()}-desc`} className={`text-sm mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 bg-white/10 hover:bg-white/20 text-[var(--text-primary)]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${
                  variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 text-[var(--text-primary)]'
                    : 'bg-orange-500 hover:bg-orange-600 text-[var(--text-primary)]'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
