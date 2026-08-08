import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const titleId = `confirm-modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const messageId = message ? `${titleId}-desc` : undefined;
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Move focus to cancel button (safer default than the potentially destructive confirm)
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            className="relative w-full max-w-[340px] shadow-2xl p-6 border border-[var(--border-color)] bg-[var(--bg-tertiary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={titleId} className="text-lg font-bold mb-2 text-[var(--text-primary)]">{title}</h3>
            {message && <p id={messageId} className="text-sm mb-6 leading-relaxed text-gray-400">{message}</p>}
            <div className="flex gap-3">
              <button
                ref={cancelRef}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};




