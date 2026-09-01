import { useEffect, type ReactNode } from 'react';
import { useI18n } from '../../lib/i18n';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: ReactNode;
  cancelIcon?: ReactNode;
  variant?: 'default' | 'danger';
  theme?: 'light' | 'dark';
  zIndex?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmIcon,
  cancelIcon,
  variant = 'default',
  theme = 'dark',
  zIndex = 'z-50',
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
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      isDark={isDark}
      maxWidth="max-w-sm"
      zIndex={zIndex}
      footer={
        <>
          <Button
            variant="secondary"
            size="md"
            className={`flex-1 ${cancelIcon ? 'min-w-11 px-0' : ''}`}
            onClick={onCancel}
            aria-label={cancelIcon ? cancelLabel : undefined}
            icon={cancelIcon}
            iconSize={18}
          >
            {cancelIcon ? <span className="sr-only">{cancelLabel}</span> : cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            className={`flex-1 ${confirmIcon ? 'min-w-11 px-0' : ''}`}
            onClick={onConfirm}
            aria-label={confirmIcon ? confirmLabel : undefined}
            icon={confirmIcon}
            iconSize={18}
          >
            {confirmIcon ? <span className="sr-only">{confirmLabel}</span> : confirmLabel}
          </Button>
        </>
      }
    >
      <p className={`text-[length:var(--text-sm)] mb-[var(--spacing-24)] leading-relaxed text-[var(--text-secondary)]`}>{message}</p>
    </Modal>
  );
}
