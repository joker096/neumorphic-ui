import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Trash2, Download, Heart, Star, Mic, Video, MoreVertical, Search, X, Volume2, VolumeX, SkipBack, SkipForward, ListFilter } from 'lucide-react';
import { useAppStore } from '../store';
import { callRecorderService, type CallRecording } from '../lib/callRecorderService';

interface RecordingsScreenProps {
  theme: 'dark' | 'light';
  onBack: () => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function RecordingItem({ recording, onPlay, onDelete, onExport, onToggleFavorite, isDark }: {
  recording: CallRecording;
  onPlay: (r: CallRecording) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
  isDark: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isVideo = recording.callType === 'video' || recording.callType === 'group_video';
  const names = recording.participants.map(p => p.displayName).join(', ');

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl transition-colors group ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
      <button onClick={() => onPlay(recording)} className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}>
        {isVideo ? <Video className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm truncate ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>
            {recording.title || names || 'Untitled'}
          </span>
          {recording.isFavorite && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />}
        </div>
        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          <span>{formatDate(recording.createdAt)}</span>
          <span>&middot;</span>
          <span>{formatDuration(recording.recordingDuration)}</span>
          <span>&middot;</span>
          <span>{(recording.fileSize / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>
      <button onClick={() => onPlay(recording)} className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-orange-500 text-white' : 'bg-orange-500 text-white'}`}>
        <Play className="w-4 h-4" />
      </button>
      <div className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className={`absolute right-0 top-full mt-1 z-20 w-44 rounded-2xl py-1 shadow-2xl border ${isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-black/10'}`}>
              <button onClick={() => { onToggleFavorite(recording.id); setMenuOpen(false); }} className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-slate-700'}`}>
                <Heart className="w-4 h-4" /> {recording.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
              </button>
              <button onClick={() => { onExport(recording.id, recording.title || 'recording'); setMenuOpen(false); }} className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/5 text-slate-700'}`}>
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => { onDelete(recording.id); setMenuOpen(false); }} className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecordingPlayer({ recording, blobUrl, isDark, onClose, onDelete, onExport }: {
  recording: CallRecording;
  blobUrl: string;
  isDark: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onExport: (id: string, title: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = blobUrl;
      audioRef.current.play().catch(() => setPlaying(false));
    }
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    };
  }, [blobUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  };

  const skip = (sec: number) => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + sec, duration));
  };

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const cycleRate = () => {
    const idx = rates.indexOf(rate);
    const next = rates[(idx + 1) % rates.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 ${isDark ? 'bg-[#1a1d24]' : 'bg-white'}`}>
        <audio ref={audioRef} onTimeUpdate={() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }} onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }} onEnded={() => setPlaying(false)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />

        <div className={`flex items-center justify-between mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <h3 className="font-semibold text-sm truncate">{recording.title || 'Recording'}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>

        <div className={`mb-4 text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {recording.participants.length > 0 && <p>{recording.participants.map(p => p.displayName).join(', ')}</p>}
          <p>Duration: {formatDuration(recording.duration)}</p>
        </div>

        <input type="range" min={0} max={duration || 0} value={currentTime} onChange={(e) => { const t = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = t; setCurrentTime(t); }} className="w-full h-1.5 accent-orange-500 cursor-pointer mb-1" />
        <div className={`flex justify-between text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={() => skip(-15)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>-15s</button>
          <button onClick={() => skip(-5)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>-5s</button>
          <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center hover:brightness-110 transition-all">
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>
          <button onClick={() => skip(5)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>+5s</button>
          <button onClick={() => skip(15)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>+15s</button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v; setMuted(false); }} className="w-20 h-1 accent-orange-500 cursor-pointer" />
          </div>
          <button onClick={cycleRate} className={`px-2 py-1 text-xs font-mono rounded ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}>{rate}x</button>
          <div className="flex items-center gap-1">
            <button onClick={() => onExport(recording.id, recording.title || 'recording')} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-black/10 text-slate-600'}`}><Download className="w-4 h-4" /></button>
            <button onClick={() => onDelete(recording.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function RecordingsScreen({ theme, onBack }: RecordingsScreenProps) {
  const isDark = theme === 'dark';
  const recordings = useAppStore((s: any) => s.recordings || []);
  const searchQuery = useAppStore((s: any) => s.recordingsSearchQuery || '');
  const sortBy = useAppStore((s: any) => s.recordingsSortBy || 'date');
  const sortOrder = useAppStore((s: any) => s.recordingsSortOrder || 'desc');
  const updateSettings = useAppStore((s: any) => s.updateSettings);
  const addRecording = useAppStore((s: any) => s.addRecording);
  const deleteRecordingStore = useAppStore((s: any) => s.deleteRecording);
  const toggleFavorite = useAppStore((s: any) => s.toggleFavorite);

  const [selectedRecording, setSelectedRecording] = useState<CallRecording | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePlay = useCallback(async (rec: CallRecording) => {
    setLoading(true);
    setSelectedRecording(rec);
    try {
      const blob = await callRecorderService.getRecordingBlob(rec.blobId);
      if (blob) setBlobUrl(URL.createObjectURL(blob));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setSelectedRecording(null);
  }, [blobUrl]);

  const handleDelete = useCallback(async (id: string) => {
    await callRecorderService.deleteRecording(id);
    deleteRecordingStore(id);
    if (selectedRecording?.id === id) handleClose();
  }, [deleteRecordingStore, selectedRecording, handleClose]);

  const handleExport = useCallback((id: string, title: string) => {
    callRecorderService.exportRecording(id, title);
  }, []);

  const filtered = useMemo(() => {
    let list = [...(recordings as CallRecording[])];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.title?.toLowerCase().includes(q) || r.participants.some(p => p.displayName.toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date': cmp = a.createdAt - b.createdAt; break;
        case 'duration': cmp = a.recordingDuration - b.recordingDuration; break;
        case 'type': cmp = a.callType.localeCompare(b.callType); break;
        case 'name': cmp = (a.title || '').localeCompare(b.title || ''); break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [recordings, searchQuery, sortBy, sortOrder]);

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'duration', label: 'Duration' },
    { value: 'type', label: 'Type' },
    { value: 'name', label: 'Name' },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack} className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1a1d24] border border-white/10 hover:bg-white/10' : 'bg-white border border-black/10 hover:bg-black/5'}`}>
          <SkipBack className="w-5 h-5 rotate-180" />
        </button>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Recordings</h2>
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
          <input type="text" value={searchQuery} onChange={(e) => updateSettings({ recordingsSearchQuery: e.target.value })}
            placeholder="Search recordings..."
            className={`w-full pl-9 pr-3 py-2 rounded-2xl text-sm outline-none ${isDark ? 'bg-[#1a1d24] text-gray-200 placeholder:text-gray-500' : 'bg-white text-slate-800 placeholder:text-slate-400 border border-black/10'}`} />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 mb-3 overflow-x-auto">
        {sortOptions.map(opt => (
          <button key={opt.value} onClick={() => updateSettings({ recordingsSortBy: opt.value })}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${sortBy === opt.value ? 'bg-orange-500 text-white' : isDark ? 'bg-[#1a1d24] text-gray-400 hover:text-gray-200' : 'bg-white text-slate-500 hover:text-slate-800 border border-black/10'}`}>
            {opt.label} {sortBy === opt.value && (sortOrder === 'asc' ? '\u2191' : '\u2193')}
          </button>
        ))}
        <button onClick={() => updateSettings({ recordingsSortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
          className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-[#1a1d24] text-gray-400' : 'bg-white text-slate-500 border border-black/10'}`}>
          {sortOrder === 'asc' ? 'ASC' : 'DESC'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Mic className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Your call recordings will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(rec => (
              <RecordingItem key={rec.id} recording={rec} isDark={isDark} onPlay={handlePlay} onDelete={handleDelete} onExport={handleExport} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <AnimatePresence>
        {selectedRecording && blobUrl && (
          <RecordingPlayer recording={selectedRecording} blobUrl={blobUrl} isDark={isDark} onClose={handleClose} onDelete={handleDelete} onExport={handleExport} />
        )}
      </AnimatePresence>
    </div>
  );
}
