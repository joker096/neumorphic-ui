import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, SkipBack, SkipForward, Music, List, Radio, Heart, Volume2, VolumeX, Plus, FolderOpen, SlidersHorizontal, Video, X, ListMusic } from "lucide-react";
import { playSound } from "../lib/sounds";
import { useI18n } from "../lib/i18n";

const formatTime = (seconds: number): string => {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Audio file extension detection
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.opus', '.aac', '.m4a', '.wma'];
const isAudioFile = (file: File) => {
  return file.type.startsWith('audio/') || AUDIO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
};
const isVideoFile = (file: File) => {
  return file.type.startsWith('video/') || ['.mp4', '.webm', '.mov', '.mkv'].some(ext => file.name.toLowerCase().endsWith(ext));
};

interface MusicHubPlayerProps {
  theme: "light" | "dark";
}

export const MusicHubPlayer: React.FC<MusicHubPlayerProps> = ({ theme }) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRadioMode, setIsRadioMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Progress refs
  const progressFillRef = useRef<SVGPathElement>(null);
  const progressHandleRef = useRef<HTMLDivElement>(null);
  const arcLength = 377;

  // Audio ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playlist state
  const [playlist, setPlaylist] = useState([
    { id: "1", name: "Neon District", url: "", time: "03:42", file: null },
    { id: "2", name: "Signal Bounce", url: "", time: "04:15", file: null },
    { id: "3", name: "Encrypted Love", url: "", time: "02:58", file: null },
  ]);
  const [radioStations, setRadioStations] = useState([
    { id: "R1", name: "MetroPulse FM 104.5", url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", time: "LIVE", file: null },
    { id: "R2", name: "Lofi Beats", url: "https://streams.ilovemusic.de/iloveradio17.mp3", time: "LIVE", file: null },
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [radioStationIndex, setRadioStationIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [stationName, setStationName] = useState("");
  const [stationUrl, setStationUrl] = useState("");
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const activeList = isRadioMode ? radioStations : playlist;
  const activeIndex = isRadioMode ? radioStationIndex : currentTrackIndex;
  const currentTrack = activeList[activeIndex] || activeList[0];

  // Progress animation effect
  useEffect(() => {
    if (progressFillRef.current && !isRadioMode && totalDuration > 0) {
      const pct = Math.min(currentTime / totalDuration, 1);
      const offset = arcLength * (1 - pct * 0.5);
      progressFillRef.current.style.strokeDasharray = `${arcLength} ${arcLength}`;
      progressFillRef.current.style.strokeDashoffset = `${offset}`;
    }
  }, [currentTime, totalDuration, isRadioMode]);

  useEffect(() => {
    if (progressHandleRef.current && !isRadioMode && totalDuration > 0) {
      const pct = Math.min(currentTime / totalDuration, 1);
      const startAngle = Math.PI;
      const endAngle = 0;
      const angle = startAngle - (pct * 0.5) * (startAngle - endAngle);
      const centerX = 170;
      const centerY = 170;
      const radius = 120;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY - radius * Math.sin(angle);
      progressHandleRef.current.style.left = `${x - 6}px`;
      progressHandleRef.current.style.top = `${y - 6}px`;
    }
  }, [currentTime, totalDuration, isRadioMode]);

  // Audio playback control
  useEffect(() => {
    if (audioRef.current && currentTrack?.url) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = () => {
    if (isRadioMode) {
      setRadioStationIndex((prev) => (prev + 1) % radioStations.length);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
    playSound('outgoing-message');
  };

  const prevTrack = () => {
    if (isRadioMode) {
      setRadioStationIndex((prev) => prev - 1 < 0 ? radioStations.length - 1 : prev - 1);
    } else {
      setCurrentTrackIndex((prev) => prev - 1 < 0 ? playlist.length - 1 : prev - 1);
    }
    playSound('incoming-sms');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type.startsWith('video/') || isVideoFile(file)) {
          const url = URL.createObjectURL(file);
          setVideoUrl(url);
          setShowVideo(true);
          setIsVideoPlaying(true);
        } else if (isAudioFile(file)) {
          const objUrl = URL.createObjectURL(file);
          playlist.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: objUrl,
            time: "Added",
            file: file
          });
        }
      }
      if (!isRadioMode) {
        setCurrentTrackIndex(playlist.length - 1);
      }
      setIsPlaying(true);
    }
    e.target.value = '';
  };

  const savePlaylist = () => {
    const data = { playlist: playlist.filter(t => t.url), radioStations };
    localStorage.setItem('music_player_data', JSON.stringify(data));
  };

  const bgGradient = isDark 
    ? "bg-gradient-to-br from-[#1a0808] to-[#0d0404]" 
    : "bg-gradient-to-br from-red-500 to-red-700";

  return (
    <div className="relative">
      {/* Central Play Button - Hub Style */}
      <motion.div
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.9 }}
        className={`relative w-40 h-40 rounded-full flex items-center justify-center cursor-pointer z-40 transition-all duration-300 ${bgGradient} shadow-[0_0_40px_rgba(200,0,0,0.3),_0_4px_20px_rgba(0,0,0,0.6),_inset_0_1px_2px_rgba(255,255,255,0.05)] border-2 border-white/10 hover:shadow-[0_0_60px_rgba(220,0,0,0.4),_0_6px_30px_rgba(0,0,0,0.7),_inset_0_2px_4px_rgba(255,255,255,0.1)]`}
        style={{ position: 'relative' }}
      >
        <Heart size={24} className="text-white/30 absolute top-6 left-1/2 -translate-x-1/2" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.5))' }} />
        <div className={`absolute text-[11px] tracking-wider ${isRadioMode ? 'text-green-400' : 'text-white/50'}`}>{isRadioMode ? 'LIVE' : `${formatTime(currentTime)} / ${totalDuration ? formatTime(totalDuration) : (currentTrack?.time || '0:00')}`}</div>
        
        <div className="relative w-32 h-32 rounded-full flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)] bg-black/30"></div>
          <div className="absolute w-24 h-24 rounded-full transition-colors" style={{
            background: isRadioMode 
              ? 'linear-gradient(145deg, #11cc11, #009900)' 
              : 'linear-gradient(145deg, #cc1111, #990000)'
          }}></div>
          <div className="absolute w-20 h-20 rounded-full transition-colors" style={{
            background: isRadioMode 
              ? 'linear-gradient(145deg, #1aff1a, #00cc00)' 
              : 'linear-gradient(145deg, #ff1a1a, #cc0000)'
          }}></div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (!isPlaying) playSound('incoming-call');
              else playSound('call-busy');
              setIsPlaying(!isPlaying);
            }}
            className="absolute w-16 h-16 rounded-full flex items-center justify-center cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.2),_0_4px_15px_rgba(0,0,0,0.4)] z-10 transition-transform active:scale-95"
            style={{background: '#fff'}}
          >
            {isPlaying ? (
              <Pause size={24} className="text-black" fill="currentColor" />
            ) : (
              <Play size={24} className="text-black ml-1" fill="currentColor" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Expanded Player Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`w-[375px] h-[812px] rounded-[40px] flex flex-col items-center p-6 ${isDark ? "bg-[#0d0202]" : "bg-[#e2e8f0]"} shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            >
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-50"
              >
                <X size={20} />
              </button>

              {/* Progress Arc */}
              <div className="w-full h-[170px] relative mt-12">
                <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] h-[340px]" viewBox="0 0 340 340">
                  <path 
                    d="M 50 170 A 120 120 0 1 1 290 170"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path 
                    ref={progressFillRef}
                    d="M 50 170 A 120 120 0 1 1 290 170"
                    fill="none"
                    stroke={isRadioMode ? "#1aff1a" : "#fff"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 3px rgba(${isRadioMode ? '30, 255, 30' : '255, 255, 255'}, 0.4))`,
                      transition: 'stroke-dashoffset 0.1s linear'
                    }}
                  />
                </svg>
                <div ref={progressHandleRef} className="absolute w-[12px] h-[12px] rounded-full z-30 transition-all" style={{
                  background: isRadioMode ? '#1aff1a' : '#fff',
                  boxShadow: isRadioMode ? '0 0 10px rgba(30, 255, 30, 0.8)' : '0 0 8px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.3)'
                }}></div>
                <div className="absolute top-[82px] left-1/2 -translate-x-1/2 text-[11px] tracking-wider" style={{
                  color: isRadioMode ? '#1aff1a' : 'rgba(255,255,255,0.5)'
                }}>{isRadioMode ? 'LIVE' : `${formatTime(currentTime)} / ${totalDuration ? formatTime(totalDuration) : (currentTrack?.time || '0:00')}`}</div>
              </div>

              {/* Track Info */}
              <div className="flex flex-col items-center justify-center w-full min-w-0 px-8 mb-8">
                <span className={`text-[20px] font-medium leading-none ${isDark ? 'text-white' : 'text-slate-700'} truncate w-full text-center`}>
                  {currentTrack?.name || t('systemPlayer.noTracks')}
                </span>
                <span className={`text-[12px] font-bold tracking-widest uppercase opacity-70 mt-1.5 ${isRadioMode ? 'text-green-400' : isDark ? 'text-white' : 'text-slate-700'}`}>
                  {isRadioMode ? "RADIO LINK" : "LOCAL TRACK"}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-8 mb-6">
<button 
                   onClick={() => setIsMuted(!isMuted)}
                   className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 shadow-[4px_4px_8px_rgba(0,0,0,0.4),_-2px_-2px_4px_rgba(255,255,255,0.05)]" : "bg-black/5 hover:bg-black/10 shadow-[4px_4px_8px_rgba(165,175,190,0.4),_-2px_-2px_4px_rgba(255,255,255,0.8)]"}`}
                 >
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? (isDark ? "bg-red-500/20" : "bg-red-100") : "bg-transparent"} transition-colors`}>
                     {isMuted ? <VolumeX size={24} className={isDark ? "text-red-400" : "text-red-600"} /> : <Volume2 size={24} className={isDark ? "text-white" : "text-slate-700"} />}
                   </div>
                 </button>
                <button 
                  onClick={() => setShowEq(true)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors`}
                >
                  <SlidersHorizontal size={24} className={isDark ? "text-white" : "text-slate-700"} />
                </button>
<button
                   onClick={() => setShowPlaylist(!showPlaylist)}
                   className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors`}
                   title={showPlaylist ? t('systemPlayer.hidePlaylist') : t('systemPlayer.viewPlaylist')}
                 >
                   <ListMusic size={24} className={isDark ? "text-white" : "text-slate-700"} />
                 </button>
              </div>

              {/* File Input */}
              <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFileSelect} id="music-file-input" />
              <label 
                htmlFor="music-file-input"
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors mb-4`}
              >
                <Plus size={24} className={isDark ? "text-white" : "text-slate-700"} />
              </label>

{/* Playlist Slide-out Panel */}
                <AnimatePresence>
                  {showPlaylist && (
                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className={`absolute top-0 right-0 bottom-0 w-4/5 max-w-[280px] rounded-l-[40px] p-4 ${isDark ? "bg-[#13151b]" : "bg-[#d1d8e0]"} shadow-2xl z-40 overflow-hidden flex flex-col`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
                        <span className={`text-[12px] font-bold tracking-widest uppercase ${isDark ? "text-white" : "text-slate-700"}`}>
                          {isRadioMode ? t('systemPlayer.radioStations') : t('systemPlayer.systemPlaylist')}
                        </span>
                        <button
                          onClick={() => setShowPlaylist(false)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors`}
                        >
                          <X size={16} className={isDark ? "text-white" : "text-slate-700"} />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-1">
                        {activeList.map((track, i) => {
                          const isActive = i === activeIndex;
                          return (
                            <div
                              key={track.id}
                              onClick={() => {
                                if (isRadioMode) {
                                  setRadioStationIndex(i);
                                  playSound('outgoing-message');
                                } else {
                                  setCurrentTrackIndex(i);
                                }
                                setIsPlaying(true);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer transition-all ${
                                isActive
                                  ? (isDark ? "bg-white/10" : "bg-black/10")
                                  : (isDark ? "hover:bg-white/5" : "hover:bg-black/5")
                              }`}
                            >
                              {isRadioMode ? <Radio size={16} className={isDark ? "text-white" : "text-slate-700"} /> : <Music size={16} className={isDark ? "text-white" : "text-slate-700"} />}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-slate-700"}`}>{track.name}</span>
                                <span className={`text-xs opacity-60 ${isDark ? "text-white" : "text-slate-700"}`}>{track.time}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              {/* Audio Element */}
              {currentTrack?.url && (
                <audio 
                  ref={audioRef} 
                  src={currentTrack.url} 
                  onEnded={nextTrack} 
                  onTimeUpdate={(e) => {
                    const audio = e.currentTarget;
                    setCurrentTime(audio.currentTime);
                    if (!totalDuration) setTotalDuration(audio.duration || 0);
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicHubPlayer;