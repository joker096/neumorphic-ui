import React from "react";
import { QrCode, Settings, Plus, SlidersHorizontal, Trash2, Save, Headphones, FolderOpen, Folder, X, Video, ListMusic, List, Radio } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import type { PlayerState, PlayerActions } from "./usePlayerState";

type TopBarProps = PlayerState & PlayerActions & { theme: "light" | "dark"; setIsRadioMode: (v: boolean) => void; setRadioStations: (v: any[] | ((prev: any[]) => any[])) => void };

export const TopBar = ({
  isRadioMode, showEq, showPlaylist, setShowEq, setShowPlaylist, handleFileSelect, handleFolderSelect, handleVideoFileSelect,
  setIsRadioMode, setShowAddStationModal, setStationName, setStationUrl, setStationAddError, setRadioStations
}: TopBarProps) => {
  const { t } = useI18n();
  const textColor = "text-[var(--text-primary)] dark:text-[var(--text-warm-dark)]";
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
            className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors`}
            title={t('systemPlayer.equalizerSettings')}
          >
            <SlidersHorizontal size={16} className={textColor} />
          </div>
        )}
        {!isRadioMode && !showPlaylist && !showEq && (
          <label className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30 transition-colors`}             title={t('systemPlayer.addTrack')}>
            <Plus size={16} />
            <input type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
          </label>
        )}
        {!isRadioMode && !showPlaylist && !showEq && (
          <label className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30 transition-colors`}             title={t('systemPlayer.addFolder')}>
            <FolderOpen size={16} />
            <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFolderSelect} />
          </label>
        )}
        {!isRadioMode && !showPlaylist && !showEq && (
          <label className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:hover:bg-purple-500/30 transition-colors`}             title={t('systemPlayer.addVideo')}>
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
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openAddStation(); } }}
            className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold bg-green-100 text-green-600 hover:bg-green-200 dark:bg-[var(--player-green)]/20 dark:text-[var(--player-green)] dark:hover:bg-[var(--player-green)]/30 transition-colors`}
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
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setShowPlaylist(true); } }}
            onClick={() => setShowPlaylist(true)}
            className={`w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer font-bold bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors`}
            title={t('systemPlayer.viewPlaylist')}
          >
            <ListMusic size={16} className={textColor} />
          </div>
        )}
      </div>
    </div>
  );
};
