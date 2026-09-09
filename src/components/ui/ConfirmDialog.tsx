import type { ReactNode } from 'react';
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
            className="flex-1"
            onClick={onCancel}
            aria-label={cancelIcon ? cancelLabel : undefined}
            icon={cancelIcon}
            iconSize={18}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            className="flex-1"
            onClick={onConfirm}
            aria-label={confirmIcon ? confirmLabel : undefined}
            icon={confirmIcon}
            iconSize={18}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className={`text-[length:var(--text-sm)] mb-[var(--spacing-24)] leading-relaxed text-[var(--text-secondary)]`}>{message}</p>}
    </Modal>
  );
}
