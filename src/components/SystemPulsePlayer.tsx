import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings, Volume2, VolumeX, Play, Pause, Music, Activity, Cpu, HardDrive, SkipBack, SkipForward, ListMusic, List, Radio, ArrowLeft, ChevronLeft, Plus, SlidersHorizontal, Trash2, Save, Headphones, FolderOpen, Folder, X, Video } from "lucide-react";
import { toast } from 'sonner';
import { useAppStore } from '../store';
import { playSound } from '../lib/sounds';

// --- EQ Presets ---
const DEFAULT_EQ_PRESETS = [
   { name: "Flat", gains: [0, 0, 0, 0, 0], description: "Flat response" },
   { name: "Bass Boost", gains: [8, 5, 2, 0, 0], description: "Enhanced bass" },
   { name: "Treble Boost", gains: [0, 0, 2, 5, 8], description: "Enhanced highs" },
   { name: "Vocal", gains: [0, 3, 8, 5, 0], description: "Vocal clarity" },
   { name: "Rock", gains: [5, 2, 0, 3, 6], description: "Rock EQ curve" },
   { name: "Pop", gains: [3, 4, 1, 3, 4], description: "Pop music" },
   { name: "Jazz", gains: [4, 2, 0, 2, 4], description: "Jazz warmth" },
   { name: "Classical", gains: [6, 3, 1, 3, 6], description: "Wide dynamic range" },
   { name: "Phonograph", gains: [6, 4, 0, 2, -2], description: "Phonograph curve" },
   { name: "Bass Reduces Highs", gains: [-4, -2, 0, 2, 4], description: "Reduced bass and high" },
];

interface EQPreset {
   name: string;
   gains: number[];
   description: string;
   userCreated?: boolean;
   id?: string;
}

const loadEQPresets = (): EQPreset[] => {
   try {
      const saved = localStorage.getItem("eq_presets");
      if (saved) {
         const userPresets = JSON.parse(saved);
         return [...DEFAULT_EQ_PRESETS, ...userPresets];
      }
   } catch {
      console.warn("Failed to load EQ presets from localStorage");
   }
   return DEFAULT_EQ_PRESETS;
};

const saveUserPreset = (preset: Omit<EQPreset, "id">) => {
   try {
      const saved = localStorage.getItem("eq_presets");
      let userPresets = saved ? JSON.parse(saved) : [];
      userPresets = [...userPresets, { ...preset, id: Date.now().toString() }];
      localStorage.setItem("eq_presets", JSON.stringify(userPresets));
      return true;
   } catch {
      console.warn("Failed to save EQ preset to localStorage");
      return false;
   }
};

const deleteUserPreset = (id: string) => {
   try {
      const saved = localStorage.getItem("eq_presets");
      if (!saved) return false;
      const userPresets = JSON.parse(saved).filter((p: any) => p.id !== id);
      localStorage.setItem("eq_presets", JSON.stringify(userPresets));
      return true;
   } catch {
      console.warn("Failed to delete EQ preset from localStorage");
      return false;
   }
};

// --- File type detection ---
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.opus', '.aac', '.m4a', '.wma'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
const isAudioFile = (file: File) => {
   return file.type.startsWith('audio/') || AUDIO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
};
const isVideoFile = (file: File) => {
   return file.type.startsWith('video/') || VIDEO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
};

const loadAudioFiles = async (files: FileList | File[] | FileSystemHandle[], onAdd: (file: File) => void) => {
   const audioFiles: File[] = [];
   for (const item of files) {
      if (item instanceof File) {
         if (isAudioFile(item)) {
            audioFiles.push(item);
         }
      } else if ('isDirectory' in item && item.isDirectory) {
         try {
            const entries = [];
            for await (const entry of (item as any).entries()) {
               entries.push(entry);
            }
            for (const entry of entries) {
               if ('isFile' in entry && entry.isFile && (entry as any).isFile) {
                  const file = await (entry as any).getFile();
                  if (file && isAudioFile(file)) {
                     audioFiles.push(file);
                  }
               }
            }
         } catch (e) {
            console.warn("Failed to read directory:", e);
         }
      }
   }
   audioFiles.forEach(onAdd);
   return audioFiles.length;
};

// --- Headphone detection ---
const detectAudioOutputDevices = () => {
   try {
      return navigator.mediaDevices?.enumerateDevices().then((devices) => {
         return {
            audioOutput: devices.filter((d) => d.kind === 'audiooutput'),
            audioInput: devices.filter((d) => d.kind === 'audioinput'),
         };
      }).catch(() => ({ audioOutput: [], audioInput: [] })) as Promise<{ audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] }>;
   } catch {
      return Promise.resolve({ audioOutput: [], audioInput: [] });
   }
};

interface MediaDeviceInfo {
   deviceId: string;
   label: string;
   kind: string;
   groupId: string;
}

export const SystemPulsePlayer = ({ theme }: { theme: "light" | "dark" }) => {
   const isDark = theme === "dark";
   const [isPlaying, setIsPlaying] = useState(false);
   const [showPlaylist, setShowPlaylist] = useState(false);
   const [showEq, setShowEq] = useState(false);
   
   const [isRadioMode, setIsRadioMode] = useState(false);
   const [radioStationIndex, setRadioStationIndex] = useState(0);
   const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

   // Modal state for adding radio stations
   const [showAddStationModal, setShowAddStationModal] = useState(false);
   const [stationName, setStationName] = useState("");
   const [stationUrl, setStationUrl] = useState("");
   const [stationAddError, setStationAddError] = useState("");

   const [playlist, setPlaylist] = useState([
     { id: "1", name: "Neon District", url: "", time: "03:42", file: null },
     { id: "2", name: "Signal Bounce", url: "", time: "04:15", file: null },
     { id: "3", name: "Encrypted Love", url: "", time: "02:58", file: null },
   ]);
   
   const audioRef = useRef<HTMLAudioElement | null>(null);

   const [radioStations, setRadioStations] = useState([
     { id: "R1", name: "MetroPulse FM 104.5", url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", time: "LIVE", file: null },
     { id: "R2", name: "Lofi Beats", url: "https://streams.ilovemusic.de/iloveradio17.mp3", time: "LIVE", file: null },
   ]);

   const activeList = isRadioMode ? radioStations : playlist;
    const activeIndex = isRadioMode ? radioStationIndex : currentTrackIndex;
    const currentTrack = activeList[activeIndex] || activeList[0];
    
    // Video state
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

   const [volume, setVolume] = useState(100);
   const [eqGains, setEqGains] = useState([0, 0, 0, 0, 0]); // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
   const [currentPreset, setCurrentPreset] = useState("Flat");
   const [savedPresets, setSavedPresets] = useState<EQPreset[]>(loadEQPresets());
   const [showPresetMenu, setShowPresetMenu] = useState(false);
   const [showSavePresetModal, setShowSavePresetModal] = useState(false);
   const [newPresetName, setNewPresetName] = useState("");
   
   // Headphone detection
   const [audioDevices, setAudioDevices] = useState<{ audioOutput: MediaDeviceInfo[]; audioInput: MediaDeviceInfo[] }>({ audioOutput: [], audioInput: [] });
   const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>("");
   const [hasHeadphones, setHasHeadphones] = useState(false);
   const [showDeviceMenu, setShowDeviceMenu] = useState(false);

   // Ripple state
   const [rippleState, setRippleState] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
   
   // Long-press state for avatars
   const [longPressActive, setLongPressActive] = useState<string | null>(null);

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

   // Device detection on mount
   useEffect(() => {
      const detectDevices = async () => {
         try {
            const devices = await navigator.mediaDevices?.enumerateDevices().catch(() => []) as MediaDeviceInfo[];
            setAudioDevices({
               audioOutput: devices.filter(d => d.kind === 'audiooutput') || [],
               audioInput: devices.filter(d => d.kind === 'audioinput') || [],
            });
            // Check if headphones are connected
            const hasHeadphones = devices.some(d => d.kind === 'audiooutput' && (d.label?.toLowerCase().includes('headphone') || d.label?.toLowerCase().includes('earphone') || d.label?.toLowerCase().includes('headset')));
            setHasHeadphones(hasHeadphones);
         } catch (e) {
            console.warn("Device detection failed:", e);
         }
      };
      detectDevices();
      // Check every 5 seconds
      const interval = setInterval(detectDevices, 5000);
      return () => clearInterval(interval);
   }, []);

   // Handle device change
   useEffect(() => {
      if (selectedOutputDevice && audioCtxRef.current) {
         try {
            (audioCtxRef.current as any).selectDevice?.(selectedOutputDevice);
         } catch (e) {
            console.warn("Failed to select device:", e);
         }
      }
   }, [selectedOutputDevice]);

   const handleEnded = () => {
      nextTrack();
   };

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
   
  const [isMuted, setIsMuted] = useState(false);
    
    // Video file handling
    const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
       if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          if (isVideoFile(file)) {
             const url = URL.createObjectURL(file);
             setVideoUrl(url);
             setShowVideo(true);
             setIsVideoPlaying(true);
             toast.success("Video loaded", { description: file.name });
          } else {
             toast.error("Invalid file", { description: "Please select a video file" });
          }
       }
       e.target.value = "";
    };
    
    const toggleVideoPlayback = () => {
       if (videoRef.current) {
          if (isVideoPlaying) {
             videoRef.current.pause();
          } else {
             videoRef.current.play().catch(() => {});
          }
          setIsVideoPlaying(!isVideoPlaying);
       }
    };
    
    const closeVideo = () => {
       setShowVideo(false);
       if (videoUrl) URL.revokeObjectURL(videoUrl);
       setVideoUrl(null);
       setIsVideoPlaying(false);
    };

   // Apply EQ preset
   const applyPreset = (preset: EQPreset) => {
      setEqGains(preset.gains);
      setCurrentPreset(preset.name);
      toast.info(`Applied: ${preset.name}`);
   };

   // Save preset
   const savePreset = () => {
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
   };

   // Delete preset (user-created only)
   const deletePreset = (id: string) => {
      const deleted = deleteUserPreset(id);
      if (deleted) {
         setSavedPresets(loadEQPresets());
         setCurrentPreset("Flat");
         toast.success("Preset deleted");
      }
   };

  // Handle folder/directory loading
    const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          // Play first video if found
          if (videoFiles.length > 0) {
             const firstVideo = videoFiles[0];
             const objUrl = URL.createObjectURL(firstVideo);
             setVideoUrl(objUrl);
             setShowVideo(true);
             setIsVideoPlaying(true);
             toast.success("Video loaded", { description: firstVideo.name });
          }
          // Add remaining audio files to playlist
          const audioCount = audioFiles.length;
          if (audioCount > 0) {
             audioFiles.forEach((file) => {
                const objUrl = URL.createObjectURL(file);
                const newTrack = { id: Math.random().toString(36).substr(2, 9), name: file.name.replace(/\.[^/.]+$/, ""), url: objUrl, time: "Added", file: file as any };
                setPlaylist((prev: any) => [...prev, newTrack]);
             });
            setCurrentTrackIndex(playlist.length);
             setIsPlaying(true);
          }
          if (videoFiles.length === 0 && audioFiles.length === 0) {
             toast.info("No media files found in folder");
          }
       }
       e.target.value = ""; // Reset input
    };

   // Handle single file loading
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
       if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          if (isVideoFile(file)) {
             const objUrl = URL.createObjectURL(file);
             setVideoUrl(objUrl);
             setShowVideo(true);
             setIsVideoPlaying(true);
             toast.success("Video loaded", { description: file.name });
          } else {
             loadAudioFiles([file], (f) => {
                const objUrl = URL.createObjectURL(f);
                const newTrack = { id: Math.random().toString(36).substr(2, 9), name: f.name.replace(/\.[^/.]+$/, ""), url: objUrl, time: "Added", file: f as any };
                setPlaylist((prev: any) => [...prev, newTrack]);
                setCurrentTrackIndex(playlist.length);
                setIsPlaying(true);
             });
          }
          e.target.value = "";
       }
    };

   const initWebAudio = () => {
     try {
       if (!audioCtxRef.current && audioRef.current) {
         const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
         audioCtxRef.current = ctx;
         
         // CORS proxying or crossOrigin="anonymous" is needed for remote streams if supported
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
         for(let i=0; i<filters.length - 1; i++) {
            filters[i].connect(filters[i+1]);
         }
         filters[filters.length - 1].connect(ctx.destination);
       }
       
       if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume();
       }
     } catch(e) {
       console.warn("Web Audio API not supported or CORS blocked.", e);
     }
   };

   useEffect(() => {
     if (eqNodesRef.current.length > 0) {
       eqGains.forEach((gain, i) => {
          // Cap gains -12 to 12
          eqNodesRef.current[i].gain.value = gain;
       });
     }
   }, [eqGains]);

  const bgColor = isDark ? "bg-[#2a3036]" : "bg-[#e2e8f0]";
   const textColor = isDark ? "text-[#e6d6b8]" : "text-slate-700";
   const darkShadow = isDark ? "shadow-[8px_8px_16px_rgba(0,0,0,0.6),_-8px_-8px_16px_rgba(255,255,255,0.05)]" : "shadow-[8px_8px_16px_rgba(165,175,190,0.6),_-8px_-8px_16px_rgba(255,255,255,0.8)]";
   const insetShadow = isDark ? "shadow-[inset_4px_4px_8px_rgba(0,0,0,0.6),_inset_-4px_-4px_8px_rgba(255,255,255,0.05)]" : "shadow-[inset_4px_4px_8px_rgba(165,175,190,0.6),_inset_-4px_-4px_8px_rgba(255,255,255,0.8)]";

   // Ripple effect handler
   const createRipple = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRippleState({ x, y, active: true });
      setTimeout(() => setRippleState({ x: 0, y: 0, active: false }), 600);
   };

   return (
     <div className={`w-full max-w-[400px] rounded-[40px] flex flex-col items-center p-6 sm:p-8 ${bgColor} ${darkShadow} relative overflow-hidden font-sans border ${isDark ? "border-white/[0.02]" : "border-black/[0.02]"} transition-all duration-300`}>
       {/* Ripple effect */}
       {rippleState.active && (
         <div
           className="absolute inset-0 pointer-events-none"
           style={{ zIndex: 1 }}
         >
           <div
             className="absolute rounded-full animate-ping"
             style={{
               left: rippleState.x,
               top: rippleState.y,
               width: 50,
               height: 50,
               transform: '-webkit-translate(-50%, -50%)',
               background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
             }}
           />
         </div>
       )}

       {/* Audio Element - only render when track has valid URL */}
       {currentTrack?.url && (
         <audio ref={audioRef} src={currentTrack.url} onEnded={handleEnded} onPlay={() => { setIsPlaying(true); initWebAudio(); }} onPause={() => setIsPlaying(false)} />
       )}

{/* Top Bar - System Info */}
        <div className="w-full flex items-center justify-end px-2 mb-8 relative z-10">
          <div className="flex items-center gap-2">
           {!showEq && !showPlaylist && (
              <div 
                role="button"
                tabIndex={0}
                onClick={() => setShowEq(true)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowEq(true); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"} transition-colors`} title="Equalizer & Settings"
             >
               <SlidersHorizontal size={16} className={textColor} />
             </div>
           )}
           {!isRadioMode && !showPlaylist && !showEq && (
              <div role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') handleFileSelect({ target: { files: [] } } as any); }} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"} transition-colors`} title="Add Track">
                <Plus size={16} />
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
             </div>
           )}
           {!isRadioMode && !showPlaylist && !showEq && (
               <label className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-green-100 text-green-600 hover:bg-green-200"} transition-colors`} title="Add Folder">
                  <FolderOpen size={16} />
                  <input type="file" accept="audio/*,video/*" className="hidden" onChange={handleFolderSelect} />
               </label>
            )}
            {!isRadioMode && !showPlaylist && !showEq && (
               <label className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" : "bg-purple-100 text-purple-600 hover:bg-purple-200"} transition-colors`} title="Add Video">
                  <Video size={16} />
                  <input type="file" accept="video/*,.mp4,.webm,.ogg,.mov" className="hidden" onChange={handleVideoFileSelect} />
               </label>
            )}
{isRadioMode && !showPlaylist && !showEq && (
               <div role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { setStationName(""); setStationUrl(""); setStationAddError(""); setShowAddStationModal(true); } }} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-[#5cc25c]/20 text-[#5cc25c] hover:bg-[#5cc25c]/30" : "bg-green-100 text-green-600 hover:bg-green-200"} transition-colors`} title="Add Station">
                 <Plus size={16} />
               </div>
            )}
            {!showPlaylist && !showEq && (
              <div role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowPlaylist(true); }} onClick={() => setShowPlaylist(true)} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors`} title="View Playlist">
                 <ListMusic size={16} className={textColor} />
              </div>
            )}
          </div>
        </div>

      <AnimatePresence mode="wait">
        {showEq ? (
           <motion.div 
             key="eq-view"
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="flex flex-col w-full h-[450px] relative z-10"
           >
              <div className="flex items-center justify-between mb-6 border-b border-white/[0.05] pb-4">
                   <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowEq(false)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowEq(false); }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-white/5 text-[#e6d6b8] hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10"} transition-colors`}
                  >
                     <ArrowLeft size={18} />
                  </div>
                  <span className={`text-[13px] font-bold tracking-[0.1em] uppercase ${textColor}`}>Audio Settings</span>
                  <div className="w-10" />
              </div>
              
              <div className="flex-1 flex flex-col gap-6 px-2 overflow-y-auto">
                 <div>
                    <div className={`text-[11px] font-bold tracking-widest uppercase mb-3 ${textColor} opacity-70`}>Master Volume</div>
<div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 shadow-[4px_4px_8px_rgba(0,0,0,0.4),_-2px_-2px_4px_rgba(255,255,255,0.05)]" : "bg-black/5 hover:bg-black/10 shadow-[4px_4px_8px_rgba(165,175,190,0.4),_-2px_-2px_4px_rgba(255,255,255,0.8)]"}`} title="Volume Min" onClick={() => setVolume(0)}>
                          <VolumeX size={16} className={textColor} />
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" 
                          value={volume} 
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className={`flex-1 h-3 rounded-full appearance-none outline-none ${isDark ? "bg-black/20" : "bg-black/10"}`}
                          style={{ 
                             background: `linear-gradient(to right, ${isRadioMode ? (isDark ? '#5cc25c' : '#2cab50') : (isDark ? '#e2845c' : '#ab502c')} ${volume}%, ${isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'} ${volume}%)` 
                          }}
                        />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? "bg-white/5 hover:bg-white/10 shadow-[4px_4px_8px_rgba(0,0,0,0.4),_-2px_-2px_4px_rgba(255,255,255,0.05)]" : "bg-black/5 hover:bg-black/10 shadow-[4px_4px_8px_rgba(165,175,190,0.4),_-2px_-2px_4px_rgba(255,255,255,0.8)]"}`} title="Volume Max" onClick={() => setVolume(100)}>
                          <Volume2 size={16} className={textColor} />
                        </div>
                     </div>
                 </div>

                 <div className="mt-4">
                    <div className={`text-[11px] font-bold tracking-widest uppercase mb-6 ${textColor} opacity-70`}>5-Band Equalizer</div>
                    <div className="flex items-end justify-between h-[150px] px-2 gap-2">
                       {[60, 230, 910, "3.6k", "14k"].map((freq, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                             <div className="text-[10px] font-mono opacity-50">{eqGains[i] > 0 ? `+${eqGains[i]}` : eqGains[i]}</div>
                             <input 
                               type="range" 
                               min="-12" max="12" 
                               value={eqGains[i]} 
                               onChange={(e) => {
                                  const newGains = [...eqGains];
                                  newGains[i] = Number(e.target.value);
                                  setEqGains(newGains);
                               }}
                               className="w-1.5 h-[100px] rounded-full appearance-none outline-none slider-vertical"
                               style={{ 
                                  writingMode: 'vertical-lr',
                                  direction: 'rtl',
                                  WebkitAppearance: 'slider-vertical',
                                  background: isDark ? '#1a1d24' : '#cbd5e1'
                               }}
                             />
                             <div className="text-[9px] font-bold mt-2">{freq}</div>
                          </div>
                       ))}
                    </div>
                    <div className="flex justify-center mt-6">
                       <button 
                         onClick={() => setEqGains([0,0,0,0,0])}
                         className={`px-4 py-2 rounded-xl text-xs font-bold ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"} transition-colors`}
                       >
                          Reset EQ
                       </button>
                    </div>
                 </div>
              </div>
           </motion.div>
        ) : !showPlaylist ? (
          <motion.div 
            key="player-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center w-full"
          >
            {/* Top Arc Element (5/4) -> Playlist Count */}
            <div className={`w-[220px] h-[50px] rounded-[25px] flex items-center justify-center relative z-10 mb-6 ${isDark ? "bg-[#333a41]" : "bg-[#d1d8e0]"} ${insetShadow} transition-colors`}>
              {/* Decorative dots */}
              <div className={`absolute top-[35px] left-[30px] w-4 h-4 rounded-full ${isRadioMode ? "bg-[#5cc25c]" : "bg-[#c25c34]"} shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors`} />
              <div className={`absolute top-[45px] left-[70px] w-3 h-3 rounded-full ${isRadioMode ? "bg-[#2cab50]" : "bg-[#ab502c]"} shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors`} />
              <div className={`absolute top-[48px] left-[105px] w-4 h-4 rounded-full ${isRadioMode ? "bg-[#5cc25c]" : "bg-[#c25c34]"} shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors`} />
              <div className="absolute top-[45px] right-[70px] w-3 h-3 rounded-full bg-[#404850] shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors" />
              <div className="absolute top-[35px] right-[30px] w-4 h-4 rounded-full bg-[#353c43] shadow-[2px_2px_4px_rgba(0,0,0,0.5)] transition-colors" />
              
              <span className={`text-[18px] font-medium tracking-wider ${textColor}`}>{activeIndex + 1}/{activeList.length}</span>
            </div>

{/* Radio / Normal Toggle */}
             <div className="relative mb-6 z-10 flex justify-center w-full" title={isRadioMode ? "Switch to Local Playlist" : "Switch to Radio Player"}>
               <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-40 h-24 rounded-full bg-gradient-to-b from-transparent to-black/20 -z-10 blur-[1px] pointer-events-none transition-opacity duration-300`} />
                 <motion.div
                   onClick={() => setIsRadioMode(!isRadioMode)}
                   whileTap={{ scale: 0.9 }}
                  className={`relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer ${isDark ? "bg-gradient-to-br from-[#454d57] to-[#2a3036] border border-white/5" : "bg-gradient-to-br from-[#d1d8e0] to-[#a3b1c6] border border-black/5"} shadow-[6px_6px_12px_rgba(0,0,0,0.4),_inset_-3px_-3px_6px_rgba(255,255,255,0.1),_inset_3px_3px_6px_rgba(0,0,0,0.3)] ${isDark ? "hover:shadow-[8px_8px_16px_rgba(0,0,0,0.5),_inset_-2px_-2px_4px_rgba(255,255,255,0.15),_inset_2px_2px_4px_rgba(0,0,0,0.3)]" : "hover:shadow-[8px_8px_16px_rgba(165,175,190,0.5),_inset_-2px_-2px_4px_rgba(255,255,255,0.8),_inset_2px_2px_4px_rgba(165,175,190,0.3)]"} transition-all`}
                >
                  <div className={`absolute inset-0 rounded-full ${isDark ? "bg-gradient-to-br from-[#5cc25c]/20 to-transparent" : "bg-gradient-to-br from-green-500/20 to-transparent"} opacity-${isRadioMode ? "100" : "0"} transition-opacity`} />
                  {isRadioMode ? <Radio size={22} className="text-[#5cc25c] drop-shadow-[0_0_4px_rgba(92,194,92,0.5)]" /> : <List size={22} className={textColor} />}
               </motion.div>
             </div>

            {/* Value Readout - Track Index */}
            <div className="w-full flex items-center justify-between px-8 mb-8 relative z-10 gap-4">
              <div 
                onClick={prevTrack}
                title="Previous Track"
                className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl cursor-pointer ${isDark ? "bg-[#e6d6b8] text-[#2a3036]" : "bg-[#a3b1c6] text-white"} shadow-[4px_4px_8px_rgba(0,0,0,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-transform`}
              >
                <SkipBack size={18} fill="currentColor" />
              </div>
              <div className="flex flex-col items-center justify-center w-full min-w-0 px-2 overflow-hidden">
                 <span className={`text-[20px] sm:text-[24px] font-medium leading-none ${textColor} truncate w-full text-center transition-colors`} title={currentTrack?.name}>{currentTrack?.name || "No Tracks"}</span>
                 <span className={`text-[12px] font-bold tracking-widest uppercase opacity-70 ${isRadioMode ? (isDark ? "text-[#5cc25c]" : "text-green-600") : textColor} mt-1.5 transition-colors`}>{isRadioMode ? "RADIO LINK" : "LOCAL TRACK"}</span>
              </div>
              <div 
                onClick={nextTrack}
                title="Next Track"
                className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl cursor-pointer ${isDark ? "bg-[#e6d6b8] text-[#2a3036]" : "bg-[#a3b1c6] text-white"} shadow-[4px_4px_8px_rgba(0,0,0,0.4),_inset_-1px_-1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-transform`}
              >
                <SkipForward size={18} fill="currentColor" />
              </div>
            </div>

            {/* Main Dial */}
            <div className="relative w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] flex items-center justify-center mb-8 z-10 scale-95 sm:scale-100">
               {/* Ticks */}
               {Array.from({ length: 60 }).map((_, i) => {
                 const rotate = i * 6;
                 const isPrimary = i % 5 === 0;
                 // Simulate progress
                 const progressIndex = isPlaying ? ((Date.now() / 100) % 60) : 0;
                 return (
                   <div 
                     key={i} 
                     className="absolute w-[2px] h-full"
                     style={{ transform: `rotate(${rotate}deg)` }}
                   >
                      <div className={`w-full ${isPrimary ? 'h-4' : 'h-2'} rounded-full transition-colors duration-300 ${isPlaying && Math.abs(i - progressIndex) < 5 ? (isRadioMode ? "bg-[#5cc25c]" : "bg-[#e2845c]") : i < ((activeIndex + 1) / (activeList.length || 1)) * 60 ? (isRadioMode ? "bg-[#45a045]" : "bg-[#c25c34]") : (isDark ? "bg-[#404850]" : "bg-[#cbd5e1]")}`} />
                   </div>
                 );
               })}

               {/* The Dial itself */}
               <div className={`w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-full flex items-center justify-center ${darkShadow} bg-[#2a3036] overflow-hidden relative`}>
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
                   {/* Inner dial part */}
                   <div className={`w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] rounded-full flex items-center justify-center shadow-[inset_10px_10px_20px_rgba(0,0,0,0.5)] bg-gradient-to-br ${isRadioMode ? "from-[#45a045] to-[#256e25]" : "from-[#c25c34] to-[#8a3e21]"} relative z-30 opacity-90 transition-colors`}>
                  <div className={`w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.4)] transition-colors relative overflow-visible`}>
                           {/* Album Art - centered behind button */}
                           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-full border-2 ${isRadioMode ? 'border-[#45a045]/50' : 'border-[#c25c34]/50'} z-[1]`}></div>
                           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] rounded-full border ${isRadioMode ? 'border-[#5cc25c]/40' : 'border-[#e2845c]/40'} z-[1]`}></div>
                           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[10px] rounded-full ${isRadioMode ? 'bg-[#45a045]' : 'bg-[#c25c34]'} z-[1]`}></div>
                           {/* Tap Button */}
                           <div 
                             onClick={() => {
                            if (!isPlaying) playSound('incoming-call');
                            else playSound('call-busy');
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
        ) : (
          <motion.div 
            key="playlist-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col w-full h-[450px] relative z-10"
          >
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.05] pb-4">
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowPlaylist(false)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowPlaylist(false); }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-white/5 text-[#e6d6b8] hover:bg-white/10" : "bg-black/5 text-slate-700 hover:bg-black/10"} transition-colors`}
                  title="Back to Player"
                >
                   <ArrowLeft size={18} />
                </div>
                <span className={`text-[13px] font-bold tracking-[0.1em] uppercase ${textColor}`}>{isRadioMode ? "Radio Stations" : "System Playlist"}</span>
                
                {/* Add Track Button */}
                {!isRadioMode ? (
                   <label className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"} transition-colors`} title="Add Track">
                     <Plus size={18} />
                     <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                           const file = e.target.files[0];
                           const objUrl = URL.createObjectURL(file);
                           const newTrack = { id: Math.random().toString(36).substr(2, 9), name: file.name.replace(/\.[^/.]+$/, ""), url: objUrl, time: "Added", file: file as any };
                           setPlaylist([...playlist, newTrack]);
                        }
                     }} />
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
              
              <div className={`flex flex-col gap-3 flex-1 overflow-y-auto pr-2 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
                {activeList.map((track, i) => {
                  const isActive = i === activeIndex;
                return (
                  <div 
                    key={track.id}
                    className={`flex items-center gap-4 p-3 rounded-[20px] transition-all group ${
                      isActive 
                        ? (isDark ? "bg-[#333a41] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)]" : "bg-[#d1d8e0] shadow-[inset_2px_2px_4px_rgba(165,175,190,0.6)]")
                        : (isDark ? "hover:bg-[#333a41]/50" : "hover:bg-black/5")
                    }`}
                  >
                 <div 
                        onClick={() => {
                          if (isRadioMode) {
                             setRadioStationIndex(i);
                             playSound('outgoing-message');
                          } else {
                             setCurrentTrackIndex(i);
                             const track = playlist[i];
                             if (track && track.file && isVideoFile(track.file)) {
                                const url = URL.createObjectURL(track.file);
                                setVideoUrl(url);
                                setShowVideo(true);
                                setIsVideoPlaying(true);
                             }
                          }
                          if (!isPlaying) setIsPlaying(true);
                        }}
                       className="flex items-center flex-1 min-w-0 gap-4 cursor-pointer"
                     >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? (isRadioMode ? "bg-[#45a045]" : "bg-[#c25c34]") : (isDark ? "bg-[#2a3036] border border-white/5" : "bg-white border border-black/5")} shadow-md transition-colors`}>
                        {isActive && isPlaying ? (
                          <div className="flex gap-0.5 items-end h-3">
                            <motion.div animate={{ height: ["4px", "10px", "4px"] }} transition={{ duration: 0.8, repeat: Infinity }} className={`w-1 ${isRadioMode ? "bg-[#183a18]" : "bg-[#3a1a0d]"} rounded-full`} />
                            <motion.div animate={{ height: ["8px", "4px", "12px", "8px"] }} transition={{ duration: 0.9, repeat: Infinity }} className={`w-1 ${isRadioMode ? "bg-[#183a18]" : "bg-[#3a1a0d]"} rounded-full`} />
                            <motion.div animate={{ height: ["5px", "12px", "5px"] }} transition={{ duration: 0.7, repeat: Infinity }} className={`w-1 ${isRadioMode ? "bg-[#183a18]" : "bg-[#3a1a0d]"} rounded-full`} />
                          </div>
                        ) : (
                          isRadioMode ? <Radio size={14} className={isActive ? "text-[#183a18]" : textColor} /> : <Music size={14} className={isActive ? "text-[#3a1a0d]" : textColor} />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-[14px] font-bold truncate ${isActive && isDark ? "text-white" : textColor}`}>{track.name}</span>
                        <span className={`text-[11px] font-mono opacity-60 ${textColor}`}>M-NODE {track.id}</span>
                      </div>
                      <span className={`text-[11px] font-mono opacity-50 ${textColor} mr-2`}>{track.time}</span>
                    </div>

                    {/* Delete button (only show for tracks/stations user could have added theoretically) */}
                    <div 
                      onClick={(e) => {
                         e.stopPropagation();
                         const confirmDel = window.confirm(`Delete ${track.name}?`);
                         if (confirmDel) {
                            if (isRadioMode) {
                               setRadioStations(radioStations.filter((_, idx) => idx !== i));
                               if (activeIndex === i) {
                                  setIsPlaying(false);
                                  setRadioStationIndex(0);
                               } else if (activeIndex > i) {
                                  setRadioStationIndex(activeIndex - 1);
                               }
                            } else {
                               setPlaylist(playlist.filter((_, idx) => idx !== i));
                               if (activeIndex === i) {
                                  setIsPlaying(false);
                                  setCurrentTrackIndex(0);
                               } else if (activeIndex > i) {
                                  setCurrentTrackIndex(activeIndex - 1);
                               }
                            }
                         }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}
                      title="Remove"
                    >
                       <Trash2 size={14} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Video Player Overlay */}
       {showVideo && videoUrl && (
         <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-[40px]">
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
               <div className="w-full h-full flex items-center justify-center">
                  <video
                     ref={videoRef}
                     src={videoUrl}
                     className="max-w-full max-h-full rounded-xl"
                     controls
                     autoPlay
                     onPause={() => setIsVideoPlaying(false)}
                     onPlay={() => setIsVideoPlaying(true)}
                     onEnded={() => closeVideo()}
                  />
               </div>
               <button 
                  onClick={closeVideo}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
               >
                  <X size={20} />
               </button>
            </div>
         </div>
       )}

        {/* Add Station Modal */}
       {showAddStationModal && (
         <div className="absolute inset-0 bg-black/60 rounded-[40px] flex items-center justify-center z-50 backdrop-blur-sm">
           <div className={`w-[90%] max-w-[320px] rounded-2xl p-6 ${isDark ? "bg-[#2a3036]" : "bg-[#e8ecf4]"}`}>
             <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Add Radio Station</h3>
             <div className="mb-3">
               <label className={`text-xs font-medium ${textColor} opacity-70`}>Station Name</label>
               <input
                 type="text"
                 value={stationName}
                 onChange={(e) => setStationName(e.target.value)}
                 placeholder="e.g. MetroPulse FM"
                 className={`w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white border border-black/10"}`}
                 autoFocus
               />
             </div>
             <div className="mb-3">
               <label className={`text-xs font-medium ${textColor} opacity-70`}>Stream URL</label>
               <input
                 type="text"
                 value={stationUrl}
                 onChange={(e) => setStationUrl(e.target.value)}
                 placeholder="https://stream.example.com/live"
                 className={`w-full mt-1 px-3 py-2 rounded-xl text-sm outline-none ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white border border-black/10"}`}
               />
               {stationAddError && (
                 <p className="text-xs text-red-400 mt-1">{stationAddError}</p>
               )}
             </div>
             <div className="flex gap-2 mt-4">
               <button
                 onClick={() => {
                   if (!stationName.trim()) {
                     setStationAddError("Name is required");
                     return;
                   }
                   if (!stationUrl.trim()) {
                     setStationAddError("URL is required");
                     return;
                   }
                   if (!stationUrl.startsWith("http://") && !stationUrl.startsWith("https://")) {
                     setStationAddError("URL must start with http:// or https://");
                     return;
                   }
                   const newStation = { id: Math.random().toString(36).substr(2, 9), name: stationName.trim(), url: stationUrl.trim(), time: "LIVE", file: null };
                   setRadioStations([...radioStations, newStation]);
                   setRadioStationIndex(radioStations.length);
                   setIsPlaying(true);
                   setShowAddStationModal(false);
                 }}
                 className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold ${isDark ? "bg-[#5cc25c] text-white" : "bg-green-600 text-white"}`}
               >
                 Add Station
               </button>
               <button
                 onClick={() => setShowAddStationModal(false)}
                 className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold ${isDark ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-black/10 text-slate-600 hover:bg-black/20"}`}
               >
                 Cancel
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };
