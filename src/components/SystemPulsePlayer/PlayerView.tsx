import React from "react";
import { motion } from "motion/react";
import { SkipBack, SkipForward, Play, Pause, List, Radio } from "lucide-react";
import { useI18n } from "../../lib/i18n";

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
  textColor?: string;
  isDark?: boolean;
  darkShadow?: string;
  insetShadow?: string;
};

export const PlayerView = ({
  isRadioMode, isPlaying, setIsPlaying, setIsRadioMode, volume, setVolume,
  activeList, activeIndex, currentTrack, nextTrack, prevTrack, createRipple, initWebAudio,
}: PlayerViewProps) => {
  const { t } = useI18n();
  return (
    <motion.div
      key="player-view"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center w-full"
    >
      <div className="w-[180px] h-[40px] sm:w-[220px] sm:h-[50px] flex items-center justify-center relative z-10 mb-6 bg-[var(--bg-secondary)] shadow-[var(--player-neo-dot-inset)] transition-colors">
        <div className={`absolute top-[35px] left-[30px] w-4 h-4 rounded-full ${isRadioMode ? "bg-[var(--player-green)]" : "bg-[var(--player-orange)]"} shadow-[var(--player-neo-dot)] transition-colors`} />
        <div className={`absolute top-[45px] left-[70px] w-3 h-3 rounded-full ${isRadioMode ? "bg-[var(--player-eq-green)]" : "bg-[var(--player-orange-dark)]"} shadow-[var(--player-neo-dot)] transition-colors`} />
        <div className={`absolute top-[48px] left-[105px] w-4 h-4 rounded-full ${isRadioMode ? "bg-[var(--player-green)]" : "bg-[var(--player-orange)]"} shadow-[var(--player-neo-dot)] transition-colors`} />
        <div className="absolute top-[45px] right-[70px] w-3 h-3 rounded-full bg-[var(--player-inactive-dot)] shadow-[var(--player-neo-dot)] transition-colors" />
        <div className="absolute top-[35px] right-[30px] w-4 h-4 rounded-full bg-[var(--player-inactive-dot2)] shadow-[var(--player-neo-dot)] transition-colors" />
        <span className="text-lg font-medium tracking-wider text-[var(--text-primary)]">{activeIndex + 1}/{activeList.length}</span>
      </div>

      <div className="relative mb-6 z-10 flex justify-center w-full" title={isRadioMode ? t('systemPlayer.switchToPlaylist') : t('systemPlayer.switchToRadio')}>
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full bg-gradient-to-b from-transparent to-black/20 -z-10 blur-[1px] pointer-events-none transition-opacity duration-300`} />
        <motion.div
          onClick={() => setIsRadioMode(!isRadioMode)}
          whileTap={{ scale: 0.9 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border border-[var(--border-color)] shadow-[var(--player-neo-plate-raised)] transition-all"
        >
          <div className={`absolute inset-0 rounded-full ${isRadioMode ? "bg-gradient-to-br from-[var(--player-green)]/20 to-transparent" : "bg-gradient-to-br from-[var(--player-green)]/20 to-transparent"} ${isRadioMode ? "opacity-100" : "opacity-0"} transition-opacity`} />
          {isRadioMode ? <Radio size={24} className="text-[var(--player-green)] drop-shadow-[var(--player-led-green-sm)]" /> : <List size={24} className="text-[var(--text-primary)]" />}
        </motion.div>
      </div>

      <div className="w-full flex items-center justify-between px-8 mb-8 relative z-10 gap-4">
        <div
          onClick={prevTrack}
          title={t('systemPlayer.previousTrack')}
          className="w-9 h-9 min-w-11 min-h-11 shrink-0 rounded-full flex items-center justify-center text-xl cursor-pointer bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-[var(--player-neo-key)] active:scale-95 transition-transform"
        >
          <SkipBack size={18} fill="currentColor" />
        </div>
        <div className="flex flex-col items-center justify-center w-full min-w-0 px-2 overflow-hidden">
          <span className="text-xl sm:text-2xl font-medium leading-none text-[var(--text-primary)] truncate w-full text-center transition-colors" title={currentTrack?.name}>{currentTrack?.name || t('systemPlayer.noTracks')}</span>
          <span className="text-xs font-bold tracking-widest uppercase opacity-70 text-[var(--text-primary)] mt-1.5 transition-colors">{isRadioMode ? t('systemPlayer.radioLink') : t('systemPlayer.localTrack')}</span>
        </div>
        <div
          onClick={nextTrack}
          title={t('systemPlayer.nextTrack')}
          className="w-9 h-9 min-w-11 min-h-11 shrink-0 rounded-full flex items-center justify-center text-xl cursor-pointer bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-[var(--player-neo-key)] active:scale-95 transition-transform"
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
              <div className={`w-full ${isPrimary ? 'h-4' : 'h-2'} rounded-full transition-colors duration-300 ${isPlaying && Math.abs(i - progressIndex) < 5 ? (isRadioMode ? "bg-[var(--player-green)]" : "bg-[var(--player-eq-orange)]") : i < ((activeIndex + 1) / (activeList.length || 1)) * 60 ? (isRadioMode ? "bg-[var(--player-green-dark)]" : "bg-[var(--player-orange)]") : "bg-[var(--bg-tertiary)]"}`} />
            </div>
          );
        })}

        <div className={`w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full flex items-center justify-center shadow-[var(--player-neo-plate)] bg-gradient-to-br from-transparent to-black/20 relative z-30 opacity-90 transition-colors`}>
          {isPlaying && (
            <div className="absolute inset-x-0 bottom-6 flex justify-center items-end gap-[3px] h-12 opacity-80 z-20 pointer-events-none">
              {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <motion.div
                  key={bar}
                  animate={{ height: ["10%", "90%", "30%", "100%", "20%"] }}
                  transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                  className={`w-[5px] rounded-t-full ${isRadioMode ? "bg-[var(--player-green)] shadow-[var(--player-led-green)]" : "bg-[var(--player-orange)] shadow-[var(--player-led-orange)]"}`}
                />
              ))}
            </div>
          )}
          <div className={`w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] rounded-full flex items-center justify-center shadow-[var(--player-neo-plate)] bg-gradient-to-br ${isRadioMode ? "from-[var(--player-green-dark)] to-[var(--player-green-deep)]" : "from-[var(--player-orange)] to-[var(--player-orange-deep)]"} relative z-30 opacity-90 transition-colors`}>
            <div className={`w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full flex items-center justify-center shadow-[var(--player-neo-slot)] transition-colors relative overflow-visible`}>
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-full border-2 ${isRadioMode ? 'border-[var(--player-green-dark)] opacity-50' : 'border-[var(--player-orange)] opacity-50'} z-10`}></div>
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] rounded-full border ${isRadioMode ? 'border-[var(--player-green)] opacity-40' : 'border-[var(--player-eq-orange)] opacity-40'} z-10`}></div>
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full ${isRadioMode ? 'bg-[var(--player-green-dark)]' : 'bg-[var(--player-orange)]'} z-10`}></div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isPlaying) initWebAudio();
                  setIsPlaying(!isPlaying);
                }}
                className={`w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] rounded-full flex items-center justify-center cursor-pointer shadow-[var(--player-neo-knob)] ${isRadioMode ? "bg-[var(--player-green-bright)]" : "bg-[var(--player-orange-bright)]"} active:scale-95 transition-all active:shadow-[var(--player-neo-knob-inset)] z-10`}
              >
                {isPlaying ? (
                  <Pause size={32} className="text-[var(--player-play-text)]" fill="currentColor" />
                ) : (
                  <Play size={32} className="text-[var(--player-play-text)] ml-1" fill="currentColor" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

