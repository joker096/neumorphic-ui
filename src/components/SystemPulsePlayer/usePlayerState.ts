import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from 'sonner';
import { playSound } from '../../lib/sounds';
import { loadEQPresets, saveUserPreset, deleteUserPreset, isAudioFile, isVideoFile, loadAudioFiles, MediaDeviceInfo } from "./utils";
import type { EQPreset } from "./utils";

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
  savedPresets: EQPreset[];
  showPresetMenu: boolean;
  showSavePresetModal: boolean;
  newPresetName: string;
  audioDevices: { audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] };
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
  setSavedPresets: (v: EQPreset[] | ((prev: EQPreset[]) => EQPreset[])) => void;
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
  applyPreset: (preset: EQPreset) => void;
  savePreset: () => void;
  deletePreset: (id: string) => void;
  handleFolderSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  createRipple: (e: React.MouseEvent<HTMLDivElement>) => void;
  initWebAudio: () => void;
  setAudioDevices: (v: { audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] }) => void;
};

export const usePlayerState = (theme: "light" | "dark"): PlayerState & PlayerActions => {
  const isDark = theme === "dark";

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [isRadioMode, setIsRadioMode] = useState(false);
  const [radioStationIndex, setRadioStationIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [stationName, setStationName] = useState("");
  const [stationUrl, setStationUrl] = useState("");
  const [stationAddError, setStationAddError] = useState("");

  const [playlist, setPlaylist] = useState<Track[]>([
    { id: "1", name: "Neon District", url: "", time: "03:42", file: null },
    { id: "2", name: "Signal Bounce", url: "", time: "04:15", file: null },
    { id: "3", name: "Encrypted Love", url: "", time: "02:58", file: null },
  ]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [radioStations, setRadioStations] = useState<Track[]>([
    { id: "R1", name: "MetroPulse FM 104.5", url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", time: "LIVE", file: null },
    { id: "R2", name: "Lofi Beats", url: "https://streams.ilovemusic.de/iloveradio17.mp3", time: "LIVE", file: null },
  ]);

  const activeList = isRadioMode ? radioStations : playlist;
  const activeIndex = isRadioMode ? radioStationIndex : currentTrackIndex;
  const currentTrack = activeList[activeIndex] || activeList[0];

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [volume, setVolume] = useState(100);
  const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0]);
  const [currentPreset, setCurrentPreset] = useState("Flat");
  const [savedPresets, setSavedPresets] = useState<EQPreset[]>(loadEQPresets());
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");

  const [audioDevices, setAudioDevices] = useState<{ audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] }>({ audioOutput: [], audioInput: [] });
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");
  const [hasHeadphones, setHasHeadphones] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);

  const [rippleState, setRippleState] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [confirmDeleteMode, setConfirmDeleteMode] = useState<'playlist' | 'radio'>('playlist');

  const objectURLsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentTrack?.url) {
        audioRef.current.play().catch(() => { setIsPlaying(false); playSound('incoming-call'); });
      } else if (!isPlaying) {
        audioRef.current.pause();
        playSound('call-busy');
      }
    }
  }, [isPlaying, currentTrack, activeIndex, isRadioMode]);

  useEffect(() => {
    return () => {
      objectURLsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectURLsRef.current.clear();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      if (eqNodesRef.current) {
        eqNodesRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    const detectDevices = async () => {
      try {
        const devices = await (navigator.mediaDevices?.enumerateDevices().catch(() => []) as Promise<MediaDeviceInfo[]>);
        setAudioDevices({
          audioOutput: devices.filter(d => d.kind === 'audiooutput') || [],
          audioInput: devices.filter(d => d.kind === 'audioinput') || [],
        });
        const hasHeadphones = devices.some(d => d.kind === 'audiooutput' && (d.label?.toLowerCase().includes('headphone') || d.label?.toLowerCase().includes('earphone') || d.label?.toLowerCase().includes('headset')));
        setHasHeadphones(hasHeadphones);
      } catch (e) {
        console.warn("Device detection failed:", e);
      }
    };
    detectDevices();
    const interval = setInterval(detectDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedOutputDevice && audioCtxRef.current) {
      try {
        (audioCtxRef.current as any).selectDevice?.(selectedOutputDevice);
      } catch (e) {
        console.warn("Failed to select device:", e);
      }
    }
  }, [selectedOutputDevice]);

  useEffect(() => {
    if (eqNodesRef.current.length > 0) {
      eqGains.forEach((gain, i) => {
        eqNodesRef.current[i].gain.value = gain;
      });
    }
  }, [eqGains]);

  const initWebAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current && audioRef.current) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        audioRef.current.crossOrigin = "anonymous";
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;
        const freqs = [60, 230, 910, 3600, 14000];
        const filters = freqs.map(f => {
          const filter = ctx.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = f;
          filter.Q.value = 1;
          filter.gain.value = 0;
          return filter;
        });
        eqNodesRef.current = filters;
        source.connect(filters[0]);
        for (let i = 0; i < filters.length - 1; i++) {
          filters[i].connect(filters[i + 1]);
        }
        filters[filters.length - 1].connect(ctx.destination);
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      console.warn("Web Audio API not supported or CORS blocked.", e);
    }
  }, []);

  const handleEnded = useCallback(() => nextTrack(), [isRadioMode, radioStations, playlist]);

  const nextTrack = useCallback(() => {
    if (isRadioMode) {
      setRadioStationIndex((prev) => (prev + 1) % radioStations.length);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
    playSound('outgoing-message');
  }, [isRadioMode, radioStations.length, playlist.length]);

  const prevTrack = useCallback(() => {
    if (isRadioMode) {
      setRadioStationIndex((prev) => prev - 1 < 0 ? radioStations.length - 1 : prev - 1);
    } else {
      setCurrentTrackIndex((prev) => prev - 1 < 0 ? playlist.length - 1 : prev - 1);
    }
    playSound('incoming-sms');
  }, [isRadioMode, radioStations.length, playlist.length]);

  const handleVideoFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isVideoFile(file)) {
        const objUrl = URL.createObjectURL(file);
        objectURLsRef.current.add(objUrl);
        setVideoUrl(objUrl);
        setShowVideo(true);
        setIsVideoPlaying(true);
        toast.success("Video loaded", { description: file.name });
      } else {
        toast.error("Invalid file", { description: "Please select a video file" });
      }
    }
    e.target.value = "";
  }, []);

  const toggleVideoPlayback = useCallback(() => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  }, [isVideoPlaying]);

  const closeVideo = useCallback(() => {
    setShowVideo(false);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      objectURLsRef.current.delete(videoUrl);
    }
    setVideoUrl(null);
    setIsVideoPlaying(false);
  }, [videoUrl]);

  const applyPreset = useCallback((preset: EQPreset) => {
    setEqGains(preset.gains);
    setCurrentPreset(preset.name);
    toast.info(`Applied: ${preset.name}`);
  }, []);

  const savePreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error("Please enter a name for your preset");
      return;
    }
    const success = saveUserPreset({
      name: newPresetName.trim(),
      gains: [...eqGains],
      description: "Custom preset",
      userCreated: true,
    });
    if (success) {
      setSavedPresets(loadEQPresets());
      setCurrentPreset(newPresetName.trim());
      setNewPresetName("");
      setShowSavePresetModal(false);
      toast.success("Preset saved!");
    } else {
      toast.error("Failed to save preset");
    }
  }, [newPresetName, eqGains]);

  const deletePreset = useCallback((id: string) => {
    const deleted = deleteUserPreset(id);
    if (deleted) {
      setSavedPresets(loadEQPresets());
      setCurrentPreset("Flat");
      toast.success("Preset deleted");
    }
  }, []);

  const handleFolderSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const videoFiles: File[] = [];
      const audioFiles: File[] = [];
      for (const item of files) {
        if (item instanceof File) {
          if (isVideoFile(item)) {
            videoFiles.push(item);
          } else if (isAudioFile(item)) {
            audioFiles.push(item);
          }
        }
      }
      if (videoFiles.length > 0) {
        const firstVideo = videoFiles[0];
        const objUrl = URL.createObjectURL(firstVideo);
        objectURLsRef.current.add(objUrl);
        setVideoUrl(objUrl);
        setShowVideo(true);
        setIsVideoPlaying(true);
        toast.success("Video loaded", { description: firstVideo.name });
      }
      const audioCount = audioFiles.length;
      if (audioCount > 0) {
        audioFiles.forEach((file) => {
          const objUrl = URL.createObjectURL(file);
          objectURLsRef.current.add(objUrl);
          const newTrack = { id: Math.random().toString(36).substr(2, 9), name: file.name.replace(/\.[^/.]+$/, ""), url: objUrl, time: "Added", file: file as any };
          setPlaylist((prev) => [...prev, newTrack]);
        });
        setCurrentTrackIndex(playlist.length);
        setIsPlaying(true);
      }
      if (videoFiles.length === 0 && audioFiles.length === 0) {
        toast.info("No media files found in folder");
      }
    }
    e.target.value = "";
  }, [playlist.length]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isVideoFile(file)) {
        const objUrl = URL.createObjectURL(file);
        objectURLsRef.current.add(objUrl);
        setVideoUrl(objUrl);
        setShowVideo(true);
        setIsVideoPlaying(true);
        toast.success("Video loaded", { description: file.name });
      } else {
        loadAudioFiles([file], (f) => {
          const objUrl = URL.createObjectURL(f);
          objectURLsRef.current.add(objUrl);
          const newTrack = { id: Math.random().toString(36).substr(2, 9), name: f.name.replace(/\.[^/.]+$/, ""), url: objUrl, time: "Added", file: f as any };
          setPlaylist((prev) => [...prev, newTrack]);
          setCurrentTrackIndex(playlist.length);
          setIsPlaying(true);
        });
      }
    }
    e.target.value = "";
  }, [playlist.length]);

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRippleState({ x, y, active: true });
    setTimeout(() => setRippleState({ x: 0, y: 0, active: false }), 600);
  }, []);

  return {
    theme,
    isDark,
    isPlaying, setIsPlaying,
    showPlaylist, setShowPlaylist,
    showEq, setShowEq,
    isRadioMode, setIsRadioMode,
    radioStationIndex, setRadioStationIndex,
    currentTrackIndex, setCurrentTrackIndex,
    showAddStationModal, setShowAddStationModal,
    stationName, setStationName,
    stationUrl, setStationUrl,
    stationAddError, setStationAddError,
    playlist, setPlaylist,
    radioStations, setRadioStations,
    videoUrl, setVideoUrl,
    isVideoPlaying, setIsVideoPlaying,
    showVideo, setShowVideo,
    volume, setVolume,
    eqGains, setEqGains,
    currentPreset, setCurrentPreset,
    savedPresets, setSavedPresets,
    showPresetMenu, setShowPresetMenu,
    showSavePresetModal, setShowSavePresetModal,
    newPresetName, setNewPresetName,
    audioDevices, setAudioDevices,
    selectedOutputDevice, setSelectedOutputDevice,
    hasHeadphones, setHasHeadphones,
    showDeviceMenu, setShowDeviceMenu,
    rippleState, setRippleState,
    confirmDeleteIndex, setConfirmDeleteIndex,
    confirmDeleteMode, setConfirmDeleteMode,
    activeList, activeIndex, currentTrack,
    handleEnded,
    nextTrack, prevTrack,
    handleVideoFileSelect,
    toggleVideoPlayback,
    closeVideo,
    applyPreset,
    savePreset,
    deletePreset,
    handleFolderSelect,
    handleFileSelect,
    createRipple,
    initWebAudio,
    audioRef,
    videoRef,
  };
};
