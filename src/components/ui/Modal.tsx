import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  modalBackdrop,
  modalSurface,
  ModalHeader,
  ModalCloseButton,
  resolveDark,
  type ModalTheme,
} from './modalShared';

type ModalSize = 'sm' | 'md' | 'lg';
const SIZE: Record<ModalSize, string> = {
  sm: 'max-w-[340px]',
  md: 'max-w-[420px]',
  lg: 'max-w-[560px]',
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
          className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}
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
              <div className="flex items-start justify-between gap-3">
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
                className="absolute top-4 right-4 z-10"
              />
            )}
            <div>{children}</div>
            {footer && <div className="flex gap-3 mt-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
