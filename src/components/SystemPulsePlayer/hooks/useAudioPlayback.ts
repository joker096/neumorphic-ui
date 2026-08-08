import { useState, useEffect, useRef, useCallback } from "react";
import { playSound } from "../../../lib/sounds";
import { loadAudioFiles, isAudioFile, isVideoFile } from "../utils";
import type { Track } from "../usePlayerState";

export interface AudioPlaybackState {
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
  activeList: Track[];
  activeIndex: number;
  currentTrack: Track;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export interface AudioPlaybackActions {
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
  handleEnded: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const useAudioPlayback = (): AudioPlaybackState & AudioPlaybackActions => {
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

  const [radioStations, setRadioStations] = useState<Track[]>([
    { id: "R1", name: "MetroPulse FM 104.5", url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", time: "LIVE", file: null },
    { id: "R2", name: "Lofi Beats", url: "https://streams.ilovemusic.de/iloveradio17.mp3", time: "LIVE", file: null },
  ]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeList = isRadioMode ? radioStations : playlist;
  const activeIndex = isRadioMode ? radioStationIndex : currentTrackIndex;
  const currentTrack = activeList[activeIndex] || activeList[0];

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

  return {
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
    activeList, activeIndex, currentTrack,
    handleEnded,
    nextTrack, prevTrack,
    audioRef,
  };
};
