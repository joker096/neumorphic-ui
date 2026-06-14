import { useI18n } from '../lib/i18n';
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Play, Volume2, Maximize2, Minimize2, FastForward, RotateCcw } from "lucide-react";

const SPEEDS = [1, 1.5, 2, 0.5];

export const VideoPlayerOverlay = ({
  theme = "dark",
  open,
  onClose,
}: {
  theme?: "dark" | "light";
  open: boolean;
  onClose: () => void;
}) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [speed, setSpeed] = useState(1);
  const [isPiP, setIsPiP] = useState(false);

  const cycleSpeed = () => {
    setSpeed(prev => {
      const idx = SPEEDS.indexOf(prev);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 m-auto w-[90vw] max-w-[600px] h-[400px] rounded-[32px] overflow-hidden flex flex-col z-[110] shadow-[0_40px_80px_rgba(0,0,0,0.6)] ${
            isDark
              ? "bg-[#13151b] border border-white/10"
              : "bg-[#e2e8f0] border border-white"
          }`}
        >
          <div className="absolute top-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white font-bold tracking-widest text-[11px] uppercase drop-shadow">
              {t('media.player')}
            </span>
            <div
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center cursor-pointer text-white"
            >
              <X size={16} strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex-1 bg-black relative flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1425&q=80"
              className="opacity-80 w-full h-full object-cover"
              alt={t('media.videoFrame')}
            />
            <div className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95 shadow-2xl border border-white/20">
              <Play size={28} className="text-white fill-current ml-1" />
            </div>
          </div>

          <div
            className={`p-4 flex flex-col gap-3 relative z-10 ${isDark ? "bg-[#1a1d24]/90 backdrop-blur" : "bg-[#f4f7f9]/90 backdrop-blur"}`}
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
              className={`h-1.5 w-full rounded-full cursor-pointer relative ${isDark ? "bg-black/30" : "bg-black/10"}`}
            >
              <div className="absolute top-0 left-0 h-full w-[35%] rounded-full bg-orange-500" />
              <div className="absolute top-1/2 left-[35%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border border-black/10" />
            </div>
            <div className="flex justify-between items-center mt-2 px-2">
              <div className="flex items-center gap-3">
                <Volume2
                  size={18}
                  className={isDark ? "text-gray-400" : "text-slate-500"}
                />

                <button
                  onClick={cycleSpeed}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-colors ${
                    speed !== 1
                      ? "bg-orange-500/20 text-orange-500"
                      : isDark
                        ? "bg-white/5 text-gray-400 hover:bg-white/10"
                        : "bg-black/5 text-slate-500 hover:bg-black/10"
                  }`}
                  title={t('media.playbackSpeed')}
                >
                  <FastForward size={12} />
                  {speed}x
                </button>
              </div>

              <button
                onClick={() => setIsPiP(!isPiP)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPiP
                    ? "bg-orange-500/20 text-orange-500"
                    : isDark
                      ? "text-gray-400 hover:bg-white/10"
                      : "text-slate-500 hover:bg-black/10"
                }`}
                title={isPiP ? t('media.exitPip') : t('media.pictureInPicture')}
              >
                {isPiP ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
