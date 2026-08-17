import React from 'react';
import { Modal } from './Modal';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
  isDark?: boolean;
  closeLabel?: string;
}

export const AppModal = ({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  maxWidth = 'max-w-[380px]',
  zIndex = 'z-50',
  isDark = true,
  closeLabel = 'Close',
}: AppModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    icon={icon}
    maxWidth={maxWidth}
    zIndex={zIndex}
    isDark={isDark}
    closeLabel={closeLabel}
  >
    {children}
  </Modal>
);
