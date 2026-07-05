import React from "react";
import { motion } from "motion/react";
import { SkipBack, SkipForward, Play, Pause, List, Radio } from "lucide-react";

type Track = {
  id: string;
  name: string;
  url: string;
  time: string;
  file: File | null;
};

type PlayerViewProps = {
  isRadioMode: boolean;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  setIsRadioMode: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  activeList: Track[];
  activeIndex: number;
  currentTrack: Track;
  nextTrack: () => void;
  prevTrack: () => void;
  createRipple: (e: React.MouseEvent<HTMLDivElement>) => void;
  initWebAudio: () => void;
};

export const PlayerView = ({
  isRadioMode, isPlaying, setIsPlaying, setIsRadioMode, volume, setVolume,
  activeList, activeIndex, currentTrack, nextTrack, prevTrack, createRipple, initWebAudio,
}: PlayerViewProps) => {
  return (
    <motion.div
      key="player-view"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-[220px] h-[50px] flex items-center justify-center relative z-10 mb-6 bg-[var(--bg-secondary)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] transition-colors">
        <div className={`absolute top-[35px] left-[30px] w-4 h-4 rounded-full ${isRadioMode ? "bg-[#5cc25c]" : "bg-[#c25c34]"} shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors`} />
        <div className={`absolute top-[45px] left-[70px] w-3 h-3 rounded-full ${isRadioMode ? "bg-[#2cab50]" : "bg-[#ab502c]"} shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors`} />
        <div className={`absolute top-[48px] left-[105px] w-4 h-4 rounded-full ${isRadioMode ? "bg-[#5cc25c]" : "bg-[#c25c34]"} shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors`} />
        <div className="absolute top-[45px] right-[70px] w-3 h-3 rounded-full bg-[#404850] shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors" />
        <div className="absolute top-[35px] right-[30px] w-4 h-4 rounded-full bg-[#353c43] shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors" />
        <span className="text-[18px] font-medium tracking-wider text-[var(--text-primary)]">{activeIndex + 1}/{activeList.length}</span>
      </div>

      <div className="relative mb-6 z-10 flex justify-center w-full" title={isRadioMode ? "Switch to Local Playlist" : "Switch to Radio Player"}>
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full bg-gradient-to-b from-transparent to-black/20 -z-10 blur-[1px] pointer-events-none transition-opacity duration-300`} />
        <motion.div
          onClick={() => setIsRadioMode(!isRadioMode)}
          whileTap={{ scale: 0.9 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-white/5 shadow-[6px_6px_12px_rgba(0,0,0,0.4),_inset_-3px_-3px_6px_rgba(255,255,255,0.1),_inset_3px_3px_6px_rgba(0,0,0,0.3)] transition-all"
        >
          <div className={`absolute inset-0 rounded-full ${isRadioMode ? "bg-gradient-to-br from-[#5cc25c]/20 to-transparent" : "bg-gradient-to-br from-green-500/20 to-transparent"} ${isRadioMode ? "opacity-100" : "opacity-0"} transition-opacity`} />
          {isRadioMode ? <Radio size={22} className="text-[#5cc25c] drop-shadow-[0_0_4px_rgba(92,194,92,0.5)]" /> : <List size={22} className="text-[var(--text-primary)]" />}
        </motion.div>
      </div>

      <div className="w-full flex items-center justify-between px-8 mb-8 relative z-10 gap-4">
        <div
          onClick={prevTrack}
          title="Previous Track"
          className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl cursor-pointer bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-[4px_4px_8px_rgba(0,0,0,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
        >
          <SkipBack size={18} fill="currentColor" />
        </div>
        <div className="flex flex-col items-center justify-center w-full min-w-0 px-2 overflow-hidden">
          <span className="text-[20px] sm:text-[24px] font-medium leading-none text-[var(--text-primary)] truncate w-full text-center transition-colors" title={currentTrack?.name}>{currentTrack?.name || "No Tracks"}</span>
          <span className="text-[12px] font-bold tracking-widest uppercase opacity-70 text-[var(--text-primary)] mt-1.5 transition-colors">{isRadioMode ? "RADIO LINK" : "LOCAL TRACK"}</span>
        </div>
        <div
          onClick={nextTrack}
          title="Next Track"
          className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl cursor-pointer bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-[4px_4px_8px_rgba(0,0,0,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
        >
          <SkipForward size={18} fill="currentColor" />
        </div>
      </div>

      <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] flex items-center justify-center mb-8 z-10 scale-95 sm:scale-100" onClick={createRipple}>
        {Array.from({ length: 60 }).map((_, i) => {
          const rotate = i * 6;
          const isPrimary = i % 5 === 0;
          const progressIndex = isPlaying ? ((Date.now() / 100) % 60) : 0;
          return (
            <div key={i} className="absolute w-[2px] h-full" style={{ transform: `rotate(${rotate}deg)` }}>
              <div className={`w-full ${isPrimary ? 'h-4' : 'h-2'} rounded-full transition-colors duration-300 ${isPlaying && Math.abs(i - progressIndex) < 5 ? (isRadioMode ? "bg-[#5cc25c]" : "bg-[#e2845c]") : i < ((activeIndex + 1) / (activeList.length || 1)) * 60 ? (isRadioMode ? "bg-[#45a045]" : "bg-[#c25c34]") : "bg-[var(--bg-tertiary)]"}`} />
            </div>
          );
        })}

        <div className={`w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full flex items-center justify-center shadow-[inset_10px_10px_20px_rgba(0,0,0,0.5)] bg-gradient-to-br from-transparent to-black/20 relative z-30 opacity-90 transition-colors`}>
          {isPlaying && (
            <div className="absolute inset-x-0 bottom-6 flex justify-center items-end gap-[3px] h-12 opacity-80 z-20 pointer-events-none">
              {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <motion.div
                  key={bar}
                  animate={{ height: ["10%", "90%", "30%", "100%", "20%"] }}
                  transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                  className={`w-[5px] rounded-t-full ${isRadioMode ? "bg-[#5cc25c] shadow-[0_0_8px_rgba(92,194,92,0.8)]" : "bg-[#c25c34] shadow-[0_0_8px_rgba(226,132,92,0.8)]"}`}
                />
              ))}
            </div>
          )}
          <div className={`w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] rounded-full flex items-center justify-center shadow-[inset_10px_10px_20px_rgba(0,0,0,0.5)] bg-gradient-to-br ${isRadioMode ? "from-[#45a045] to-[#256e25]" : "from-[#c25c34] to-[#8a3e21]"} relative z-30 opacity-90 transition-colors`}>
            <div className={`w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.4)] transition-colors relative overflow-visible`}>
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-full border-2 ${isRadioMode ? 'border-[#45a045] opacity-50' : 'border-[#c25c34] opacity-50'} z-10`}></div>
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] rounded-full border ${isRadioMode ? 'border-[#5cc25c] opacity-40' : 'border-[#e2845c] opacity-40'} z-10`}></div>
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full ${isRadioMode ? 'bg-[#45a045]' : 'bg-[#c25c34]'} z-10`}></div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPlaying) initWebAudio();
                  setIsPlaying(!isPlaying);
                }}
                className={`w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] rounded-full flex items-center justify-center cursor-pointer shadow-[6px_6px_12px_rgba(0,0,0,0.4),_inset_2px_2px_4px_rgba(255,255,255,0.2)] ${isRadioMode ? "bg-[#64d064]" : "bg-[#d27546]"} active:scale-95 transition-all active:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.4)] z-10`}
              >
                {isPlaying ? (
                  <Pause size={32} className="text-[#3a1a0d]" fill="currentColor" />
                ) : (
                  <Play size={32} className="text-[#3a1a0d] ml-1" fill="currentColor" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
