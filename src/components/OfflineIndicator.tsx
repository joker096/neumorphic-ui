import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineIndicatorProps {
  isDark: boolean;
}

export function OfflineIndicator({ isDark }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem('p2p-offline-count');
        if (raw) setPendingCount(parseInt(raw, 10) || 0);
      } catch { /* ignore */ }
    }, 5000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-[70] py-2 px-4 flex items-center justify-center gap-2 text-sm font-semibold ${
            isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          No internet connection
          {pendingCount > 0 && (
            <span className="opacity-80">({pendingCount} pending)</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
