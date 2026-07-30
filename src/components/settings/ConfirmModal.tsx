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
}: ConfirmModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        key="confirm-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          className="relative w-full max-w-[340px] shadow-2xl p-6 border border-[var(--border-color)] bg-[var(--bg-tertiary)]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-2 text-[var(--text-primary)]">{title}</h3>
          {message && <p className="text-sm mb-6 leading-relaxed text-gray-400">{message}</p>}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 bg-white/10 hover:bg-white/20 text-[var(--text-primary)]"
            >
              {cancelLabel}
            </button>
            <button
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




