import { useState, useEffect, useRef } from 'react';
import { AppModal } from '../ui/AppModal';

interface TextInputModalProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  initial?: string;
  type?: 'text' | 'password';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const TextInputModal = ({
  isOpen,
  title,
  placeholder,
  initial = '',
  type = 'text',
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: TextInputModalProps) => {
  const [value, setValue] = useState(initial);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initial);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initial]);

  const handleSubmit = () => {
    onConfirm(value);
    setValue(initial);
  };

  return (
    <AppModal isOpen={isOpen} onClose={onCancel} isDark={true} title={title} maxWidth="max-w-[340px]">
      <div className="relative mb-4">
        <div
          className={`w-full h-12 rounded-full px-4 flex items-center border transition-all duration-300 ${
            focused
              ? 'border-orange-500/30'
              : 'border-[var(--border-color)]'
          }`}
        >
          <input
            ref={inputRef as any}
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={`w-full bg-transparent border-none outline-none text-[14px] text-[var(--text-primary)] placeholder:text-gray-500`}
          />
        </div>
      </div>
      <div className="flex gap-3">
         <button
           onClick={onCancel}
           className="flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 bg-white/10 hover:bg-white/20 text-[var(--text-primary)]"
         >
           {cancelLabel}
         </button>
         <button
           onClick={handleSubmit}
           className="flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 bg-orange-500 hover:bg-orange-600 text-[var(--text-primary)]"
         >
           {confirmLabel}
         </button>
       </div>
    </AppModal>
  );
};




