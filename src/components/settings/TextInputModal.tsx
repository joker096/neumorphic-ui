import { useState, useEffect, useRef } from 'react';
import { AppModal } from '../ui/AppModal';
import { Button } from '../ui/Button';

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
         <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>
           {cancelLabel}
         </Button>
         <Button variant="primary" size="md" className="flex-1" onClick={handleSubmit}>
           {confirmLabel}
         </Button>
       </div>
    </AppModal>
  );
};




