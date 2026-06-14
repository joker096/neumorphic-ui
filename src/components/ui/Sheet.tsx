import { useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  detent?: 'medium' | 'large';
  children: ReactNode;
}

export function Sheet({ isOpen, onClose, detent = 'medium', children }: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startTranslate = useRef(0);
  const currentTranslate = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    startTranslate.current = currentTranslate.current;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const delta = e.clientY - startY.current;
    if (delta > 0) {
      currentTranslate.current = startTranslate.current + delta;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${currentTranslate.current}px)`;
      }
    }
  };

  const onPointerUp = () => {
    if (currentTranslate.current > 100) {
      onClose();
    }
    currentTranslate.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 material-thin"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 1 }}
            style={{ height: detent === 'medium' ? '50vh' : '92vh' }}
            className="relative w-full max-w-lg rounded-t-2xl bg-[var(--system-background)] shadow-xl overflow-hidden touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-9 h-1 rounded-full bg-[var(--system-gray-4)] dark:bg-[var(--system-gray-2)]" />
            </div>
            <div className="overflow-y-auto h-full pb-6 px-4">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
