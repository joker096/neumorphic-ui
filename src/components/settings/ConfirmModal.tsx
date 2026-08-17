import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { modalBackdrop, modalOverlay, modalSurface, currentTheme, type ModalTheme } from '../ui/modalShared';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  isDark?: boolean;
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
  isDark,
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

  const resolvedTheme: ModalTheme = isDark === undefined ? currentTheme() : isDark ? 'dark' : 'light';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-modal"
          data-theme={resolvedTheme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={modalOverlay}
        >
          <div className={modalBackdrop} onClick={onCancel} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            className={modalSurface(true, 'max-w-[340px]')}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={titleId} className="text-lg font-bold mb-2 text-[var(--text-primary)]">{title}</h3>
            {message && <p id={messageId} className="text-sm mb-6 leading-relaxed text-gray-400">{message}</p>}
            <div className="flex gap-3">
              <Button
                ref={cancelRef}
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="md"
                className="flex-1"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
