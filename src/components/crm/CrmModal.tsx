import React, { ReactNode, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../lib/a11y';
import { useEscapeKey } from '../../hooks/useEscapeKey';

const closeBtn = (onClick: () => void, label: string) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="absolute top-4 right-4 z-10 w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  >
    <X size={18} />
  </button>
);

type ModalProps = {
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
};

export const CrmModal: React.FC<ModalProps> = ({ onClose, title, children, footer, maxWidth = 'max-w-[420px]' }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);
  useEscapeKey(onClose);

  return (
  <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} className={`w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl relative rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]`}>
      {closeBtn(onClose, 'Close')}
      <h3 className="text-xl font-bold px-6 pt-5 pb-3 text-[var(--text-primary)]">{title}</h3>
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pb-4">{children}</div>
      {footer && (
        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/60 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  </div>
  );
};
