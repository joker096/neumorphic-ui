import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';
import { useI18n } from "../../lib/i18n";

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
  confirmLabel,
  cancelLabel,
  confirmIcon,
  cancelIcon,
  variant = 'default',
  theme = 'dark',
  zIndex = 'z-[var(--z-modal)]',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  // Defaults come from the locale dictionary: most call sites pass no labels,
  // so English here meant every confirm dialog ignored the UI language.
  const confirmText = confirmLabel ?? t('confirmDialog.ok', 'Confirm');
  const cancelText = cancelLabel ?? t('confirmDialog.cancel', 'Cancel');

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
            aria-label={cancelIcon ? cancelText : undefined}
            icon={cancelIcon}
            iconSize={18}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            className="flex-1"
            onClick={onConfirm}
            aria-label={confirmIcon ? confirmText : undefined}
            icon={confirmIcon}
            iconSize={18}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      {message && <p className={`text-[length:var(--text-sm)] mb-[var(--spacing-24)] leading-relaxed text-[var(--text-secondary)]`}>{message}</p>}
    </Modal>
  );
}
