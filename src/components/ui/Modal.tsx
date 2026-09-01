import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useFocusTrap } from '../../lib/a11y';
import {
  modalBackdrop,
  modalSurface,
  ModalHeader,
  ModalCloseButton,
  resolveDark,
  type ModalTheme,
} from './modalShared';

type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const SIZE: Record<ModalSize, string> = {
  xs: 'max-w-[320px]',
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[960px]',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  iconSize?: string;
  headerAlign?: 'start' | 'center';
  size?: ModalSize;
  maxWidth?: string;
  isDark?: ModalTheme | boolean;
  closeLabel?: string;
  footer?: ReactNode;
  showClose?: boolean;
  zIndex?: string;
  ariaLabel?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  iconSize,
  headerAlign = 'start',
  size = 'md',
  maxWidth,
  isDark = true,
  closeLabel = 'Close',
  footer,
  showClose = true,
  zIndex = 'z-50',
  ariaLabel,
}: ModalProps) {
  const dark = resolveDark(isDark);
  const reduce = useReducedMotion();
  const hasHeader = Boolean(title || subtitle || icon);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-theme={dark ? 'dark' : 'light'}
          className={`fixed inset-0 ${zIndex} flex items-center justify-center p-[var(--spacing-16)]`}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={modalBackdrop}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel || title}
            initial={reduce ? false : { opacity: 0, scale: 0.95, y: 20 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
            className={modalSurface(dark, maxWidth || SIZE[size])}
            onClick={(e) => e.stopPropagation()}
          >
            {hasHeader && (
              <div className="flex items-start justify-between gap-[var(--spacing-12)]">
                <ModalHeader
                  title={title}
                  subtitle={subtitle}
                  icon={icon}
                  isDark={dark}
                  align={headerAlign}
                  iconSize={iconSize}
                />
                {showClose && (
                  <ModalCloseButton isDark={dark} onClick={onClose} label={closeLabel} className="shrink-0" />
                )}
              </div>
            )}
            {!hasHeader && showClose && (
              <ModalCloseButton
                isDark={dark}
                onClick={onClose}
                label={closeLabel}
                  className="absolute top-[var(--spacing-16)] right-[var(--spacing-16)] z-10"

              />
            )}
            <div>{children}</div>
            {footer && <div className="flex gap-[var(--spacing-12)] mt-[var(--spacing-24)]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
