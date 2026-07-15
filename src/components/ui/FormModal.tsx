import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: LucideIcon
  iconBg?: string
  iconColor?: string
  children: React.ReactNode
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
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl relative ${
              isDark
                ? 'bg-[#1a1d24] border border-white/10'
                : 'bg-white border border-black/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              title={closeTitle}
               className={`absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                 isDark
                   ? 'bg-white/10 hover:bg-white/20 text-white'
                   : 'bg-black/5 hover:bg-black/10 text-slate-800'
               }`}
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
                    isDark ? 'text-white' : 'text-slate-800'
                  }`}>
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className={`text-xs text-center mt-2 max-w-[260px] ${
                    isDark ? 'text-gray-400' : 'text-slate-500'
                  }`}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
