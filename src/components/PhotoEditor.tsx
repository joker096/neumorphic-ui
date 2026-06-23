import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Pencil, Square, Type, RotateCcw, Check, Undo2 } from 'lucide-react'
import { useAppStore } from '../store'
import { useI18n } from '../lib/i18n'

interface Props {
  open: boolean
  imageUrl: string | null
  onClose: () => void
  onSave: (editedImageData: string) => void
  theme: 'dark' | 'light'
}

type Tool = 'draw' | 'rect' | 'text'

export const PhotoEditor = ({ open, imageUrl, onClose, onSave, theme }: Props) => {
  const isDark = theme === 'dark'
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('draw')
  const [color, setColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(4)
  const [isDrawing, setIsDrawing] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<ImageData[]>([])
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const photoEditState = useAppStore(s => s.photoEditState)
  const setPhotoEditState = useAppStore(s => s.setPhotoEditState)
  const resetPhotoEditor = useAppStore(s => s.resetPhotoEditor)

  useEffect(() => {
    if (!open || !imageUrl || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)])
    }
    img.src = imageUrl
  }, [open, imageUrl])

  const saveState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setHistory(prev => [...prev.slice(-19), ctx.getImageData(0, 0, canvas.width, canvas.height)])
  }, [])

  const undo = useCallback(() => {
    if (history.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const prev = history[history.length - 2]
    ctx.putImageData(prev, 0, 0)
    setHistory(prev => prev.slice(0, -1))
  }, [history])

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const pos = getCanvasPos(e)
      setTextPos(pos)
      setTextInput('')
      return
    }
    setIsDrawing(true)
    lastPos.current = getCanvasPos(e)
    saveState()
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const addText = () => {
    if (!textInput || !textPos) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    saveState()
    ctx.font = `${brushSize * 6}px sans-serif`
    ctx.fillStyle = color
    ctx.fillText(textInput, textPos.x, textPos.y)
    setTextInput('')
    setTextPos(null)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
    resetPhotoEditor()
    onClose()
  }

  const handleClose = () => {
    resetPhotoEditor()
    onClose()
  }

  return (
    <AnimatePresence>
      {open && imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col bg-black/95"
        >
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <button onClick={handleClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10">
              <X size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/10' : 'bg-white/10'}`}>
                {(['draw', 'rect', 'text'] as Tool[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${tool === t ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'}`}
                  >
                    {t === 'draw' && <Pencil size={16} />}
                    {t === 'rect' && <Square size={16} />}
                    {t === 'text' && <Type size={16} />}
                  </button>
                ))}
              </div>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0" />
              <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-20 h-1 accent-orange-500" />
              <button onClick={undo} disabled={history.length <= 1} className={`w-8 h-8 rounded-full flex items-center justify-center ${history.length <= 1 ? 'text-white/20' : 'text-white hover:bg-white/10'}`}>
                <Undo2 size={16} />
              </button>
            </div>
            <button onClick={handleSave} className="px-4 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold flex items-center gap-1.5">
              <Check size={16} /> Save
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              className="max-w-full max-h-full rounded-2xl shadow-2xl cursor-crosshair"
              style={{ objectFit: 'contain' }}
            />
          </div>

          <AnimatePresence>
            {tool === 'text' && textPos && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 p-3 rounded-2xl bg-black/80 backdrop-blur-xl"
              >
                <input
                  autoFocus
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addText()}
                  placeholder="Type text..."
                  className="bg-white/10 text-white px-3 py-2 rounded-xl text-sm outline-none w-48"
                />
                <button onClick={addText} className="px-3 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold">
                  Add
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
