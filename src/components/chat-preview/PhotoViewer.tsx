import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Download, ZoomIn as ZoomInIcon } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface PhotoViewerProps {
  url: string | null;
  open: boolean;
  onClose: () => void;
  theme?: string;
}

export const PhotoViewerOverlay = ({ url, open, onClose }: PhotoViewerProps) => {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const startDistanceRef = useRef(0);
  const startScaleRef = useRef(1);
  const touchCountRef = useRef(0);
  const { t } = useI18n();

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = "downloaded_image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchCountRef.current = 2;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      startDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
      startScaleRef.current = scale;
      setIsPinching(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchCountRef.current !== 2) return;
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const delta = currentDistance / startDistanceRef.current;
      const newScale = Math.min(4, Math.max(0.5, startScaleRef.current * delta));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    touchCountRef.current = 0;
    setIsPinching(false);
  };

  return (
    <AnimatePresence>
      {open && url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        >
          {/* Top toolbar */}
          <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
             <div className="flex gap-2 pointer-events-auto">
                 <button 
                    onClick={handleZoomOut}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white flex-shrink-0"
                 >
                     <ZoomOut size={20} />
                 </button>
                 <button 
                    onClick={handleZoomIn}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white flex-shrink-0"
                 >
                     <ZoomInIcon size={20} />
                 </button>
                 <button 
                    onClick={handleDownload}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white flex-shrink-0"
                 >
                     <Download size={20} />
                 </button>
             </div>
             
             <div className="flex gap-2">
                 <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 flex items-center justify-center text-red-100 flex-shrink-0 transition-colors"
                 >
                     <X size={20} />
                 </button>
             </div>
          </div>
          
          <motion.div
            drag
            dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
            dragElastic={0.2}
            className="w-full h-full flex items-center justify-center p-8 overflow-hidden relative cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <motion.img
              src={url}
              alt={t('photoViewer.fullView')}
              animate={{ scale }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none rounded-[8px] shadow-[0_0_60px_rgba(0,0,0,0.8)]"
              onContextMenu={(e) => e.preventDefault()}
            />
            {/* Pinch indicator */}
            {isPinching && (
              <motion.div
                animate={{ scale: scale }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-24 h-24 rounded-full border-2 border-white/30 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-white/60 text-xs font-bold">
                    {Math.round(scale * 100)}%
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
          
          {/* Bottom attribution/details mock */}
          <div className="absolute bottom-0 w-full p-6 text-center z-10 bg-gradient-to-t from-black/80 to-transparent">
             <div className="text-white/70 text-sm font-mono opacity-80 mix-blend-screen">
                 {t('photoViewer.p2pEncrypted')}
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
