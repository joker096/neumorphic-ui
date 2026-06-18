import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface PhotoViewerProps {
  url: string | null;
  open: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
}

export const PhotoViewerOverlay = ({ url, open, onClose, theme }: PhotoViewerProps) => {
  const [scale, setScale] = useState(1);
  const isDark = theme === "dark";
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
    // Simulate download
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = "downloaded_image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl touch-none"
        >
          {/* Top toolbar */}
          <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
             <div className="flex gap-2">
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
                     <ZoomIn size={20} />
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
            className="w-full h-full flex items-center justify-center p-8 overflow-hidden relative cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              src={url}
              alt={t('photoViewer.fullView')}
              animate={{ scale }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none rounded-[8px] shadow-[0_0_60px_rgba(0,0,0,0.8)]"
              // Prevent context menu to hide default image behavior
              onContextMenu={(e) => e.preventDefault()}
            />
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
