import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useI18n } from "../../lib/i18n";
import { usePlayerState } from "./usePlayerState";
import { TopBar } from "./TopBar";
import { EqualizerPanel } from "./EqualizerPanel";
import { PlayerView } from "./PlayerView";
import { PlaylistView } from "./PlaylistView";
import { VideoOverlay } from "./VideoOverlay";
import { AddStationModal } from "./AddStationModal";

export const SystemPulsePlayer = ({ theme }: { theme: "light" | "dark" }) => {
  const state = usePlayerState(theme);
  const { t } = useI18n();

  const bgColor = state.isDark ? "bg-[#2a3036]" : "bg-[var(--bg-secondary)]";
  const textColor = state.isDark ? "text-[var(--text-warm-dark)]" : "text-slate-700";
  const darkShadow = state.isDark ? "shadow-[8px_8px_16px_rgba(0,0,0,0.6),_-8px_-8px_16px_rgba(255,255,255,0.05)]" : "shadow-[8px_8px_16px_rgba(165,175,190,0.6),_-8px_-8px_16px_rgba(255,255,255,0.8)]";
  const insetShadow = state.isDark ? "shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),_inset_-4px_-4px_8px_rgba(255,255,255,0.05)]" : "shadow-[inset_4px_4px_8px_rgba(165,175,190,0.6),_inset_-4px_-4px_8px_rgba(255,255,255,0.8)]";

  return (
    <div className={`w-full max-w-[400px] flex flex-col items-center p-6 sm:p-8 ${bgColor} ${darkShadow} relative overflow-hidden font-sans border ${state.isDark ? "border-[var(--border-color)]/[0.02]" : "border-black/[0.02]"} transition-all duration-300`}>
      {state.rippleState.active && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <div
            className="absolute rounded-full animate-ping"
            style={{
              left: state.rippleState.x,
              top: state.rippleState.y,
              width: 50,
              height: 50,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
            }}
          />
        </div>
      )}

      {state.currentTrack?.url && (
        <audio
          ref={state.audioRef}
          src={state.currentTrack.url}
          onEnded={state.handleEnded}
          onPlay={() => { state.setIsPlaying(true); state.initWebAudio(); }}
          onPause={() => state.setIsPlaying(false)}
        />
      )}

      <TopBar {...state} theme={theme} setIsRadioMode={state.setIsRadioMode} setRadioStations={state.setRadioStations} />

      <AnimatePresence mode="wait">
        {state.showEq ? (
          <EqualizerPanel
            isDark={state.isDark}
            isRadioMode={state.isRadioMode}
            volume={state.volume}
            setVolume={state.setVolume}
            eqGains={state.eqGains}
            setEqGains={state.setEqGains}
            showEq={state.showEq}
            setShowEq={state.setShowEq}
            currentPreset={state.currentPreset}
            setCurrentPreset={state.setCurrentPreset}
            savedPresets={state.savedPresets}
            setSavedPresets={state.setSavedPresets}
            applyPreset={state.applyPreset}
            savePreset={state.savePreset}
            deletePreset={state.deletePreset}
            textColor={textColor}
          />
        ) : !state.showPlaylist ? (
          <PlayerView
            isDark={state.isDark}
            isRadioMode={state.isRadioMode}
            isPlaying={state.isPlaying}
            setIsPlaying={state.setIsPlaying}
            setIsRadioMode={state.setIsRadioMode}
            volume={state.volume}
            setVolume={state.setVolume}
            activeList={state.activeList}
            activeIndex={state.activeIndex}
            currentTrack={state.currentTrack}
            nextTrack={state.nextTrack}
            prevTrack={state.prevTrack}
            createRipple={state.createRipple}
            initWebAudio={state.initWebAudio}
            textColor={textColor}
            darkShadow={darkShadow}
            insetShadow={insetShadow}
          />
        ) : (
          <PlaylistView
            isDark={state.isDark}
            isRadioMode={state.isRadioMode}
            isPlaying={state.isPlaying}
            setIsPlaying={state.setIsPlaying}
            showPlaylist={state.showPlaylist}
            setShowPlaylist={state.setShowPlaylist}
            activeList={state.activeList}
            activeIndex={state.activeIndex}
            confirmDeleteIndex={state.confirmDeleteIndex}
            setConfirmDeleteIndex={state.setConfirmDeleteIndex}
            confirmDeleteMode={state.confirmDeleteMode}
            setConfirmDeleteMode={state.setConfirmDeleteMode}
            currentTrackIndex={state.currentTrackIndex}
            setCurrentTrackIndex={state.setCurrentTrackIndex}
            radioStationIndex={state.radioStationIndex}
            setRadioStationIndex={state.setRadioStationIndex}
            playlist={state.playlist}
            setPlaylist={state.setPlaylist}
            radioStations={state.radioStations}
            setRadioStations={state.setRadioStations}
            videoUrl={state.videoUrl}
            setVideoUrl={state.setVideoUrl}
            setShowVideo={state.setShowVideo}
            setIsVideoPlaying={state.setIsVideoPlaying}
            textColor={textColor}
            setShowAddStationModal={state.setShowAddStationModal}
            stationName={state.stationName}
            setStationName={state.setStationName}
            stationUrl={state.stationUrl}
            setStationUrl={state.setStationUrl}
            stationAddError={state.stationAddError}
            setStationAddError={state.setStationAddError}
          />
        )}
      </AnimatePresence>

      <VideoOverlay
        isDark={state.isDark}
        showVideo={state.showVideo}
        videoUrl={state.videoUrl}
        videoRef={state.videoRef}
        closeVideo={state.closeVideo}
      />
      <AddStationModal
        isDark={state.isDark}
        textColor={textColor}
        showAddStationModal={state.showAddStationModal}
        setShowAddStationModal={state.setShowAddStationModal}
        stationName={state.stationName}
        setStationName={state.setStationName}
        stationUrl={state.stationUrl}
        setStationUrl={state.setStationUrl}
        stationAddError={state.stationAddError}
        setStationAddError={state.setStationAddError}
        setRadioStations={state.setRadioStations}
        radioStations={state.radioStations}
        setRadioStationIndex={state.setRadioStationIndex}
        setIsPlaying={state.setIsPlaying}
        setIsRadioMode={state.setIsRadioMode}
      />

      <ConfirmDialog
        isOpen={state.confirmDeleteIndex !== null}
        title={t('systemPlayer.remove')}
        message={t('systemPlayer.confirmRemove', { name: (state.confirmDeleteMode === 'radio' ? state.radioStations : state.playlist)[state.confirmDeleteIndex ?? 0]?.name || '' }) || `Delete ${(state.confirmDeleteMode === 'radio' ? state.radioStations : state.playlist)[state.confirmDeleteIndex ?? 0]?.name || ''}?`}
        confirmLabel={t('systemPlayer.remove')}
        cancelLabel={t('contacts.close')}
        variant="danger"
        theme={state.isDark ? 'dark' : 'light'}
        onConfirm={() => {
          if (state.confirmDeleteIndex === null) return;
          if (state.confirmDeleteMode === 'radio') {
            state.setRadioStations(state.radioStations.filter((_, idx) => idx !== state.confirmDeleteIndex));
            if (state.activeIndex === state.confirmDeleteIndex) {
              state.setIsPlaying(false);
              state.setRadioStationIndex(0);
            } else if (state.activeIndex > state.confirmDeleteIndex) {
              state.setRadioStationIndex(state.activeIndex - 1);
            }
          } else {
            state.setPlaylist(state.playlist.filter((_, idx) => idx !== state.confirmDeleteIndex));
            if (state.activeIndex === state.confirmDeleteIndex) {
              state.setIsPlaying(false);
              state.setCurrentTrackIndex(0);
            } else if (state.activeIndex > state.confirmDeleteIndex) {
              state.setCurrentTrackIndex(state.activeIndex - 1);
            }
          }
          state.setConfirmDeleteIndex(null);
        }}
        onCancel={() => state.setConfirmDeleteIndex(null)}
      />
    </div>
  );
};



