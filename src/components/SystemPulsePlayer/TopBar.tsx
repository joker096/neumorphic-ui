import React from "react";
import { QrCode, Settings, Plus, SlidersHorizontal, Trash2, Save, Headphones, FolderOpen, Folder, X, Video, ListMusic, List, Radio } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import type { PlayerState, PlayerActions } from "./usePlayerState";

type TopBarProps = PlayerState & PlayerActions & { theme: "light" | "dark"; setIsRadioMode: (v: boolean) => void; setRadioStations: (v: any[] | ((prev: any[]) => any[])) => void };

export const TopBar = ({
  isDark, isRadioMode, showEq, showPlaylist, setShowEq, setShowPlaylist, handleFileSelect, handleFolderSelect, handleVideoFileSelect,
  setIsRadioMode, setShowAddStationModal, setStationName, setStationUrl, setStationAddError, setRadioStations
}: TopBarProps) => {
  const { t } = useI18n();
  const textColor = isDark ? "text-[var(--text-warm-dark)]" : "text-slate-700";
  const openAddStation = () => {
    setStationName("");
    setStationUrl("");
    setStationAddError("");
    setShowAddStationModal(true);
  };

  return (
    <div className="w-full flex items-center justify-end px-2 mb-8 relative z-10">
      <div className="flex items-center gap-2">
        {!showEq && !showPlaylist && (
          <div
            role="button"
            tabIndex={0}
            aria-label={t('systemPlayer.equalizerSettings')}
            onClick={() => setShowEq(true)}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setShowEq(true); } }}
            className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"} transition-colors`}
            title={t('systemPlayer.equalizerSettings')}
          >
            <SlidersHorizontal size={16} className={textColor} />
          </div>
        )}
        {!isRadioMode && !showPlaylist && !showEq && (
          <label className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"} transition-colors`}             title={t('systemPlayer.addTrack')}>
            <Plus size={16} />
            <input type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
          </label>
        )}
        {!isRadioMode && !showPlaylist && !showEq && (
          <label className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-green-100 text-green-600 hover:bg-green-200"} transition-colors`}             title={t('systemPlayer.addFolder')}>
            <FolderOpen size={16} />
            <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFolderSelect} />
          </label>
        )}
        {!isRadioMode && !showPlaylist && !showEq && (
          <label className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" : "bg-purple-100 text-purple-600 hover:bg-purple-200"} transition-colors`}             title={t('systemPlayer.addVideo')}>
            <Video size={16} />
            <input type="file" accept="video/*,.mp4,.webm,.ogg,.mov" className="hidden" onChange={handleVideoFileSelect} />
          </label>
        )}
        {isRadioMode && !showPlaylist && !showEq && (
          <div
            role="button"
            tabIndex={0}
            aria-label={t('systemPlayer.addStation')}
            onClick={openAddStation}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openAddStation(); }}
            className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-[#5cc25c]/20 text-[#5cc25c] hover:bg-[#5cc25c]/30" : "bg-green-100 text-green-600 hover:bg-green-200"} transition-colors`}
            title={t('systemPlayer.addStation')}
          >
            <Plus size={16} />
          </div>
        )}
        {!showPlaylist && !showEq && (
          <div
            role="button"
            tabIndex={0}
            aria-label={t('systemPlayer.viewPlaylist')}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowPlaylist(true); }}
            onClick={() => setShowPlaylist(true)}
            className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors`}
            title={t('systemPlayer.viewPlaylist')}
          >
            <ListMusic size={16} className={textColor} />
          </div>
        )}
      </div>
    </div>
  );
};
