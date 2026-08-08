import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

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
}: AppModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-black/60 backdrop-blur-sm p-4`}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative border ${
              isDark ? 'bg-[var(--bg-tertiary)] border-[var(--border-color)]' : 'bg-white border-[var(--border-color)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || icon) && (
              <div className="flex items-center justify-between mb-4 mt-2">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                      {icon}
                    </div>
                  )}
                  <div>
                    {title && <h3 className={`text-lg font-bold ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>{title}</h3>}
                    {subtitle && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{subtitle}</p>}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-[var(--text-primary)]' : 'bg-black/5 hover:bg-black/10 text-slate-800'}`}
                  aria-label={closeLabel}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
