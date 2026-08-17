import React from 'react'
import type { ComponentType, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { modalOverlay, modalBackdrop, modalSurface, modalCloseClass, type ModalTheme } from './modalShared'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: ComponentType<{ size?: number }>
  iconBg?: string
  iconColor?: string
  children: ReactNode
  maxWidth?: string
  theme?: 'light' | 'dark'
  zIndex?: string
  closeTitle?: string
}

export const FormModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  children,
  maxWidth = 'max-w-[380px]',
  theme = 'dark',
  zIndex = 'z-50',
  closeTitle,
}: FormModalProps) => {
  const isDark = theme === 'dark'
  const resolvedTheme: ModalTheme = theme === 'light' ? 'light' : 'dark'

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-theme={resolvedTheme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={modalOverlay.replace('z-50', zIndex)}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`${modalSurface(isDark, maxWidth)} relative`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              title={closeTitle}
              className={`absolute top-4 right-4 z-10 ${modalCloseClass(isDark)}`}
            >
              <X size={18} />
            </button>

            {(Icon || title) && (
              <div className="flex flex-col items-center mb-4 mt-2">
                {Icon && (
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      iconBg || (isDark ? 'bg-orange-500/20' : 'bg-orange-100')
                    } ${iconColor || (isDark ? 'text-orange-400' : 'text-orange-600')}`}
                  >
                    <Icon size={32} />
                  </div>
                )}
                {title && (
                  <h3 className={`text-xl font-bold text-center ${
                    isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'
                  }`}>
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className={`text-xs text-center mt-2 max-w-[260px] text-[var(--text-secondary)]`}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
