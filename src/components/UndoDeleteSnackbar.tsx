import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RotateCcw, X } from 'lucide-react'

interface Props {
  visible: boolean
  message: string
  onUndo: () => void
  onDismiss: () => void
  theme: 'dark' | 'light'
}

export const UndoDeleteSnackbar = ({ visible, message, onUndo, onDismiss, theme }: Props) => {
  const isDark = theme === 'dark'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-black/10'}`}
        >
          <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{message}</span>
          <button
            onClick={onUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors active:scale-95"
          >
            <RotateCcw size={12} /> Undo
          </button>
          <button onClick={onDismiss} className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
