import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RotateCcw, X } from 'lucide-react'

export const UndoDeleteSnackbar = ({ visible, message, onUndo, onDismiss }: { visible: boolean; message: string; onUndo: () => void; onDismiss: () => void }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-4 py-3 rounded-md shadow-2xl border bg-[var(--bg-secondary)] border-[var(--border-color)]"
        >
          <span className="text-sm text-[var(--text-primary)]">{message}</span>
          <button
            onClick={onUndo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors active:scale-95"
          >
            <RotateCcw size={12} /> Undo
          </button>
          <button onClick={onDismiss} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
