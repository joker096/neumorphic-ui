import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

const closeBtn = (onClick: () => void, label: string) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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

export const CrmModal: React.FC<ModalProps> = ({ onClose, title, children, footer, maxWidth = 'max-w-[420px]' }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className={`w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl relative rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]`}>
      {closeBtn(onClose, 'Close')}
      <h3 className="text-xl font-bold px-6 pt-5 pb-3 text-[var(--text-primary)]">{title}</h3>
      <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
      {footer && (
        <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/60 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  </div>
);
