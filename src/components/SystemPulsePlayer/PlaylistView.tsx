import React from "react";
import { motion } from "motion/react";
import { Trash2, Music, Radio, Plus } from "lucide-react";

type Track = {
  id: string;
  name: string;
  url: string;
  time: string;
  file: File | null;
};

type PlaylistViewProps = {
  isDark?: boolean;
  isRadioMode: boolean;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  showPlaylist: boolean;
  setShowPlaylist: (v: boolean) => void;
  activeList: Track[];
  activeIndex: number;
  confirmDeleteIndex: number | null;
  setConfirmDeleteIndex: (v: number | null) => void;
  confirmDeleteMode: 'playlist' | 'radio';
  setConfirmDeleteMode: (v: 'playlist' | 'radio') => void;
  currentTrackIndex: number;
  setCurrentTrackIndex: (v: number) => void;
  radioStationIndex: number;
  setRadioStationIndex: (v: number) => void;
  playlist: Track[];
  setPlaylist: (v: Track[] | ((prev: Track[]) => Track[])) => void;
  radioStations: Track[];
  setRadioStations: (v: Track[] | ((prev: Track[]) => Track[])) => void;
  videoUrl: string | null;
  setVideoUrl: (v: string | null) => void;
  setShowVideo: (v: boolean) => void;
  setIsVideoPlaying: (v: boolean) => void;
  textColor?: string;
  setShowAddStationModal: (v: boolean) => void;
  stationName: string;
  setStationName: (v: string) => void;
  stationUrl: string;
  setStationUrl: (v: string) => void;
  stationAddError: string;
  setStationAddError: (v: string) => void;
};

export const PlaylistView = ({
  isDark = false, isRadioMode, isPlaying, setIsPlaying, showPlaylist, setShowPlaylist, activeList, activeIndex,
  confirmDeleteIndex, setConfirmDeleteIndex, confirmDeleteMode, setConfirmDeleteMode,
  currentTrackIndex, setCurrentTrackIndex, radioStationIndex, setRadioStationIndex,
  playlist, setPlaylist, radioStations, setRadioStations, videoUrl, setVideoUrl, setShowVideo, setIsVideoPlaying,
  textColor, setShowAddStationModal, stationName, setStationName, stationUrl, setStationUrl, stationAddError, setStationAddError
}: PlaylistViewProps) => {
  const handleTrackClick = (track: Track, i: number) => {
    if (isRadioMode) {
      setRadioStationIndex(i);
    } else {
      setCurrentTrackIndex(i);
      const t = playlist[i];
      if (t && t.file && t.file.type.startsWith('video/')) {
        const url = URL.createObjectURL(t.file);
        setVideoUrl(url);
        setShowVideo(true);
        setIsVideoPlaying(true);
      }
    }
    if (!isPlaying) setIsPlaying(true);
  };

  return (
    <motion.div
      key="playlist-view"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
     className="flex flex-col w-full h-[60vh] sm:h-[500px] md:h-[450px] relative z-10"
    >
      <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)]/[0.05] pb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowPlaylist(false)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowPlaylist(false); }}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-white/5 text-[var(--text-warm-dark)] hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10"} transition-colors`}
          title="Back to Player"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <span className={`text-[13px] font-bold tracking-[0.1em] uppercase ${textColor}`}>{isRadioMode ? "Radio Stations" : "System Playlist"}</span>
        {!isRadioMode ? (
          <label className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"} transition-colors`} title="Add Track">
            <Plus size={18} />
            <input type="file" accept="audio/*" className="hidden" />
          </label>
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-[#5cc25c]/20 text-[#5cc25c] hover:bg-[#5cc25c]/30" : "bg-green-100 text-green-600 hover:bg-green-200"} transition-colors`} title="Add Station"
            onClick={() => {
              setStationName("");
              setStationUrl("");
              setStationAddError("");
              setShowAddStationModal(true);
            }}>
            <Plus size={18} />
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-3 flex-1 overflow-y-auto pr-2`}>
        {activeList.map((track, i) => {
          const isActive = i === activeIndex;
          return (
            <motion.div
              key={track.id}
              className={`flex items-center gap-4 p-3 transition-all group ${
                isActive
                  ? (isDark ? "bg-[#333a41] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]" : "bg-[#d1d8e0] shadow-[inset_2px_2px_4px_rgba(165,175,190,0.6)]")
                  : (isDark ? "hover:bg-[#333a41]/50" : "hover:bg-black/5")
              }`}
            >
              <div
                onClick={() => handleTrackClick(track, i)}
                className="flex items-center flex-1 min-w-0 gap-4 cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? (isRadioMode ? "bg-[#45a045]" : "bg-[#c25c34]") : (isDark ? "bg-[#2a3036] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]")} shadow-md transition-colors`}>
                  {isActive && isPlaying ? (
                    <div className="flex gap-0.5 items-end h-3">
                      {[0, 1, 2].map((bar) => (
                        <motion.div
                          key={bar}
                          animate={{ height: ["4px", "10px", "4px", "8px", "4px", "12px", "4px", "8px"] }}
                          transition={{ duration: 0.6 + bar * 0.2, repeat: Infinity }}
                          className={`w-1 ${isRadioMode ? "bg-[#183a18]" : "bg-[#3a1a0d]"} rounded-full`}
                        />
                      ))}
                    </div>
                  ) : (
                    isRadioMode
                      ? <Radio size={14} className={isActive ? "text-[#183a18]" : textColor} />
                      : <Music size={14} className={isActive ? "text-[#3a1a0d]" : textColor} />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[14px] font-bold truncate ${isActive && isDark ? "text-[var(--text-primary)]" : textColor}`}>{track.name}</span>
                  <span className={`text-[11px] font-mono opacity-60 ${textColor}`}>M-NODE {track.id}</span>
                </div>
                <span className={`text-[11px] font-mono opacity-50 ${textColor} mr-2`}>{track.time}</span>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteMode(isRadioMode ? 'radio' : 'playlist');
                  setConfirmDeleteIndex(i);
                }}
                className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}
                title="Remove"
              >
                <Trash2 size={14} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};


