import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

interface VideoPlayerOverlayProps {
  theme?: "dark" | "light";
  open: boolean;
  onClose: () => void;
}

export const VideoPlayerOverlay = ({
  theme = "dark",
  open,
  onClose,
}: VideoPlayerOverlayProps) => {
  const isDark = theme === "dark";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 m-auto w-[90vw] sm:w-[600px] max-w-[600px] max-h-[80vh] h-[400px] overflow-hidden flex flex-col z-[110] shadow-[0_40px_80px_rgba(0,0,0,0.6)] ${
            isDark
              ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          }`}
        >
          <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-[var(--text-primary)] font-bold tracking-widest text-[11px] uppercase drop-shadow">
              Media Player
            </span>
            <div
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center cursor-pointer text-[var(--text-primary)]"
              aria-label="Close video"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
            >
              <X size={16} strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex-1 bg-black relative flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1425&q=80"
              className="opacity-80 w-full h-full object-cover"
              alt="Video frame"
              loading="lazy" decoding="async"
            />
            <div className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-2xl border border-[var(--border-color)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5,3 19,12 5,21" fill="currentColor" />
              </svg>
            </div>
          </div>

          <div
            className={`p-4 flex flex-col gap-3 relative z-10 ${
              isDark ? "bg-[var(--bg-tertiary)]/90 backdrop-blur" : "bg-[var(--bg-primary)]/90 backdrop-blur"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={isDark ? "text-gray-400" : "text-slate-500"}>
                0:42
              </span>
              <span className={isDark ? "text-gray-400" : "text-slate-500"}>
                2:30
              </span>
            </div>
            <div
              className={`h-1.5 w-full rounded-full cursor-pointer relative ${
                isDark ? "bg-black/30" : "bg-black/10"
              }`}
            >
              <div className="absolute top-0 left-0 h-full w-[35%] rounded-full bg-orange-500" />
              <div className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-[var(--border-color)]" />
            </div>
            <div className="flex justify-end items-center mt-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isDark ? "text-gray-400" : "text-slate-500"}>
                <path d="M21 2l-2 2m0 0L3 20l2 2M13 13l4 4" />
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};



