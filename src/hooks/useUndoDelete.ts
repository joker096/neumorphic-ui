import { useState, useCallback, useRef } from 'react'

interface UndoState {
  visible: boolean
  message: string
  onUndo: () => void
}

export function useUndoDelete() {
  const [undo, setUndo] = useState<UndoState>({ visible: false, message: '', onUndo: () => {} })
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showUndo = useCallback((message: string, onUndo: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setUndo({ visible: true, message, onUndo })
    timerRef.current = setTimeout(() => {
      setUndo(prev => ({ ...prev, visible: false }))
    }, 5000)
  }, [])

  const handleUndo = useCallback(() => {
    undo.onUndo()
    setUndo({ visible: false, message: '', onUndo: () => {} })
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [undo])

  const dismiss = useCallback(() => {
    setUndo({ visible: false, message: '', onUndo: () => {} })
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { undo, showUndo, handleUndo, dismiss }
}
