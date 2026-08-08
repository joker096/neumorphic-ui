import React, { useRef } from "react";
import { useAudioPlayback } from "./hooks/useAudioPlayback";
import { useVideoPlayback } from "./hooks/useVideoPlayback";
import { useEQSettings } from "./hooks/useEQSettings";
import { useMediaDevices } from "./hooks/useMediaDevices";
import { useFileHandling } from "./hooks/useFileHandling";
import { useRippleEffect } from "./hooks/useRippleEffect";

export type Track = {
  id: string;
  name: string;
  url: string;
  time: string;
  file: File | null;
};

export type PlayerState = {
  theme: "light" | "dark";
  isDark: boolean;
  isPlaying: boolean;
  showPlaylist: boolean;
  showEq: boolean;
  isRadioMode: boolean;
  radioStationIndex: number;
  currentTrackIndex: number;
  showAddStationModal: boolean;
  stationName: string;
  stationUrl: string;
  stationAddError: string;
  playlist: Track[];
  radioStations: Track[];
  videoUrl: string | null;
  isVideoPlaying: boolean;
  showVideo: boolean;
  volume: number;
  eqGains: number[];
  currentPreset: string;
  savedPresets: import("./utils").EQPreset[];
  showPresetMenu: boolean;
  showSavePresetModal: boolean;
  newPresetName: string;
  audioDevices: { audioOutput: import("./utils").MediaDeviceInfo[]; audioInput: import("./utils").MediaDeviceInfo[] };
  selectedOutputDevice: string;
  hasHeadphones: boolean;
  showDeviceMenu: boolean;
  rippleState: { x: number; y: number; active: boolean };
  confirmDeleteIndex: number | null;
  confirmDeleteMode: 'playlist' | 'radio';
  activeList: Track[];
  activeIndex: number;
  currentTrack: Track;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

export type PlayerActions = {
  setIsPlaying: (v: boolean) => void;
  setShowPlaylist: (v: boolean) => void;
  setShowEq: (v: boolean) => void;
  setIsRadioMode: (v: boolean) => void;
  setRadioStationIndex: (v: number) => void;
  setCurrentTrackIndex: (v: number) => void;
  setShowAddStationModal: (v: boolean) => void;
  setStationName: (v: string) => void;
  setStationUrl: (v: string) => void;
  setStationAddError: (v: string) => void;
  setPlaylist: (v: Track[] | ((prev: Track[]) => Track[])) => void;
  setRadioStations: (v: Track[] | ((prev: Track[]) => Track[])) => void;
  setVideoUrl: (v: string | null) => void;
  setIsVideoPlaying: (v: boolean) => void;
  setShowVideo: (v: boolean) => void;
  setVolume: (v: number) => void;
  setEqGains: (v: number[] | ((prev: number[]) => number[])) => void;
  setCurrentPreset: (v: string) => void;
  setSavedPresets: (v: import("./utils").EQPreset[] | ((prev: import("./utils").EQPreset[]) => import("./utils").EQPreset[])) => void;
  setShowPresetMenu: (v: boolean) => void;
  setShowSavePresetModal: (v: boolean) => void;
  setNewPresetName: (v: string) => void;
  setSelectedOutputDevice: (v: string) => void;
  setHasHeadphones: (v: boolean) => void;
  setShowDeviceMenu: (v: boolean) => void;
  setRippleState: (v: { x: number; y: number; active: boolean }) => void;
  setConfirmDeleteIndex: (v: number | null) => void;
  setConfirmDeleteMode: (v: 'playlist' | 'radio') => void;
  handleEnded: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  handleVideoFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleVideoPlayback: () => void;
  closeVideo: () => void;
  applyPreset: (preset: import("./utils").EQPreset) => void;
  savePreset: () => void;
  deletePreset: (id: string) => void;
  handleFolderSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  createRipple: (e: React.MouseEvent<HTMLDivElement>) => void;
  initWebAudio: () => void;
  setAudioDevices: (v: { audioOutput: import("./utils").MediaDeviceInfo[]; audioInput: import("./utils").MediaDeviceInfo[] }) => void;
};

export const usePlayerState = (theme: "light" | "dark"): PlayerState & PlayerActions => {
  const isDark = theme === "dark";
  const audioCtxRef = useRef<AudioContext | null>(null);

  const audio = useAudioPlayback();
  const video = useVideoPlayback();
  const eq = useEQSettings(audio.audioRef, audioCtxRef);
  const devices = useMediaDevices(audioCtxRef);
  const files = useFileHandling(
    audio.setPlaylist,
    video.setVideoUrl,
    video.setShowVideo,
    video.setIsVideoPlaying,
    audio.setCurrentTrackIndex,
    audio.setIsPlaying,
    audio.playlist
  );
  const ripple = useRippleEffect();

  const [confirmDeleteIndex, setConfirmDeleteIndex] = React.useState<number | null>(null);
  const [confirmDeleteMode, setConfirmDeleteMode] = React.useState<'playlist' | 'radio'>('playlist');

  return {
    theme,
    isDark,
    isPlaying: audio.isPlaying,
    showPlaylist: audio.showPlaylist,
    showEq: audio.showEq,
    isRadioMode: audio.isRadioMode,
    radioStationIndex: audio.radioStationIndex,
    currentTrackIndex: audio.currentTrackIndex,
    showAddStationModal: audio.showAddStationModal,
    stationName: audio.stationName,
    stationUrl: audio.stationUrl,
    stationAddError: audio.stationAddError,
    playlist: audio.playlist,
    radioStations: audio.radioStations,
    videoUrl: video.videoUrl,
    isVideoPlaying: video.isVideoPlaying,
    showVideo: video.showVideo,
    volume: eq.volume,
    eqGains: eq.eqGains,
    currentPreset: eq.currentPreset,
    savedPresets: eq.savedPresets,
    showPresetMenu: eq.showPresetMenu,
    showSavePresetModal: eq.showSavePresetModal,
    newPresetName: eq.newPresetName,
    audioDevices: devices.audioDevices,
    selectedOutputDevice: devices.selectedOutputDevice,
    hasHeadphones: devices.hasHeadphones,
    showDeviceMenu: devices.showDeviceMenu,
    rippleState: ripple.rippleState,
    confirmDeleteIndex,
    confirmDeleteMode,
    activeList: audio.activeList,
    activeIndex: audio.activeIndex,
    currentTrack: audio.currentTrack,
    audioRef: audio.audioRef,
    videoRef: video.videoRef,
    setIsPlaying: audio.setIsPlaying,
    setShowPlaylist: audio.setShowPlaylist,
    setShowEq: audio.setShowEq,
    setIsRadioMode: audio.setIsRadioMode,
    setRadioStationIndex: audio.setRadioStationIndex,
    setCurrentTrackIndex: audio.setCurrentTrackIndex,
    setShowAddStationModal: audio.setShowAddStationModal,
    setStationName: audio.setStationName,
    setStationUrl: audio.setStationUrl,
    setStationAddError: audio.setStationAddError,
    setPlaylist: audio.setPlaylist,
    setRadioStations: audio.setRadioStations,
    setVideoUrl: video.setVideoUrl,
    setIsVideoPlaying: video.setIsVideoPlaying,
    setShowVideo: video.setShowVideo,
    setVolume: eq.setVolume,
    setEqGains: eq.setEqGains,
    setCurrentPreset: eq.setCurrentPreset,
    setSavedPresets: eq.setSavedPresets,
    setShowPresetMenu: eq.setShowPresetMenu,
    setShowSavePresetModal: eq.setShowSavePresetModal,
    setNewPresetName: eq.setNewPresetName,
    setSelectedOutputDevice: devices.setSelectedOutputDevice,
    setHasHeadphones: devices.setHasHeadphones,
    setShowDeviceMenu: devices.setShowDeviceMenu,
    setRippleState: ripple.setRippleState,
    setConfirmDeleteIndex,
    setConfirmDeleteMode,
    handleEnded: audio.handleEnded,
    nextTrack: audio.nextTrack,
    prevTrack: audio.prevTrack,
    handleVideoFileSelect: video.handleVideoFileSelect,
    toggleVideoPlayback: video.toggleVideoPlayback,
    closeVideo: video.closeVideo,
    applyPreset: eq.applyPreset,
    savePreset: eq.savePreset,
    deletePreset: eq.deletePreset,
    handleFolderSelect: files.handleFolderSelect,
    handleFileSelect: files.handleFileSelect,
    createRipple: ripple.createRipple,
    initWebAudio: eq.initWebAudio,
    setAudioDevices: devices.setAudioDevices,
  };
};
