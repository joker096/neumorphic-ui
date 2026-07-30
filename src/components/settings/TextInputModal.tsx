import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            className="relative w-full max-w-[340px] shadow-2xl p-6 border border-[var(--border-color)] bg-[var(--bg-tertiary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">{title}</h3>
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};




