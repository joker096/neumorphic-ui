import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface VoiceWaveformProps {
  duration?: string;
  isMe?: boolean;
  isDark?: boolean;
  audioUrl?: string;
  stream?: MediaStream | null;
}

export const VoiceWaveform = ({ duration = "0:12", isMe, isDark, audioUrl, stream }: VoiceWaveformProps) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaStreamAudioSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
  const durationSec = duration ? duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0;

  // Initialize Web Audio API
  useEffect(() => {
    let active = true;
    const initAudio = async () => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Small fft for chunky bars
      analyserRef.current = analyser;

      if (stream) {
          // Live Recording Mode
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser); // No destination connection to avoid feedback
          sourceRef.current = source;
          setIsPlaying(true);
      } else if (audioUrl) {
          // Playback Mode URL
         try {
            const resp = await fetch(audioUrl);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuffer = await resp.arrayBuffer();
            if (!active) return;
            bufferRef.current = await ctx.decodeAudioData(arrayBuffer);
            setIsReady(true);
         } catch(e) {
            console.warn("audioUrl fetch failed (CORS/network?), falling back to generated waveform:", e);
            const sampleRate = ctx.sampleRate;
            const length = Math.max(1, sampleRate * (durationSec || 1));
            const fallbackBuffer = ctx.createBuffer(1, length, sampleRate);
            const data = fallbackBuffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < length; i++) {
               const white = (Math.random() * 2 - 1) * 0.5;
               lastOut = lastOut + (0.05 * (white - lastOut));
               let envelope = Math.abs(Math.sin((i / sampleRate) * 2));
               if (Math.sin((i / sampleRate) * 5) < -0.5) envelope = 0.05;
               data[i] = lastOut * envelope;
            }
            bufferRef.current = fallbackBuffer;
            setIsReady(true);
         }
      } else {
         // Fallback Playback Mode
         const sampleRate = ctx.sampleRate;
         const length = Math.max(1, sampleRate * (durationSec || 1));
         const buffer = ctx.createBuffer(1, length, sampleRate);
         const data = buffer.getChannelData(0);
         
         let lastOut = 0;
         for (let i = 0; i < length; i++) {
            const white = (Math.random() * 2 - 1) * 0.5;
            lastOut = lastOut + (0.05 * (white - lastOut));
            let envelope = Math.abs(Math.sin((i / sampleRate) * 2));
            if (Math.sin((i / sampleRate) * 5) < -0.5) envelope = 0.05;
            data[i] = lastOut * envelope;
         }
         bufferRef.current = buffer;
         setIsReady(true);
      }
    };
    
    initAudio();

    return () => {
       active = false;
       if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(console.error);
       }
       if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [durationSec, audioUrl, stream]);

  // Generate static waveform from buffer peaks
  const [staticWave, setStaticWave] = useState<number[]>([]);
  useEffect(() => {
     if (bufferRef.current) {
        const data = bufferRef.current.getChannelData(0);
        const bars = 40;
        const step = Math.floor(data.length / bars);
        const peaks = [];
        for (let i = 0; i < bars; i++) {
           let max = 0;
           for (let j = 0; j < step; j++) {
              const val = Math.abs(data[i * step + j]);
              if (val > max) max = val;
           }
           peaks.push(Math.max(0.05, max * 5)); // Boost visual height
        }
        setStaticWave(peaks);
     } else {
        // Fallback dummy
        setStaticWave(Array.from({length: 40}, (_, i) => Math.random() * 0.5 + 0.1));
     }
  }, [bufferRef.current]);

  const startPlaybackAt = async (offset: number) => {
     if (!audioCtxRef.current || !bufferRef.current || !analyserRef.current) return;
     const ctx = audioCtxRef.current;
     
     if (ctx.state === 'suspended') {
        await ctx.resume();
     }

     if (sourceRef.current) {
         if ('stop' in sourceRef.current) sourceRef.current.stop();
         sourceRef.current.disconnect();
      }

      const source = ctx.createBufferSource();
      source.buffer = bufferRef.current;
      source.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
      source.start(0, offset);
     startTimeRef.current = ctx.currentTime - offset;
     sourceRef.current = source;
    setIsPlaying(true);
    pausedAtRef.current = offset;

     source.onended = () => {
        if (ctx.currentTime - startTimeRef.current >= durationSec - 0.1) {
           setIsPlaying(false);
           setProgress(0);
           pausedAtRef.current = 0;
           if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
     };
  };

  const togglePlayback = async () => {
     if (!audioCtxRef.current || !bufferRef.current || !analyserRef.current) return;

     if (isPlaying) {
         if (sourceRef.current) {
            if ('stop' in sourceRef.current) sourceRef.current.stop();
            sourceRef.current.disconnect();
         }
        pausedAtRef.current = (audioCtxRef.current.currentTime - startTimeRef.current) % durationSec;
        setIsPlaying(false);
     } else {
        await startPlaybackAt(pausedAtRef.current);
     }
  };

  const handleSeek = async (nextProgress: number) => {
     if (!durationSec) return;
     const clamped = Math.max(0, Math.min(1, nextProgress));
     const nextOffset = durationSec * clamped;
     pendingSeekRef.current = clamped;
     setProgress(clamped);
     pausedAtRef.current = nextOffset;
     if (isPlaying) {
        seekingRef.current = true;
        await startPlaybackAt(nextOffset);
        seekingRef.current = false;
     }
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Setup for retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const gap = 2; // px
    
    // Colors
    const playedColor = isMe 
      ? (isDark ? '#fff' : '#fff') 
      : (isDark ? '#f97316' : '#f97316'); // Orange
      
    const unplayedColor = isMe
      ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)')
      : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Live Analyser Data
      let freqData = new Uint8Array(0);
      if (isPlaying && analyserRef.current) {
         freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
         analyserRef.current.getByteFrequencyData(freqData);
      }

      if (stream) {
         // Recording Display Mode: Entire wave is live
         const bars = 24;
         const barWidth = width / bars;
         ctx.fillStyle = playedColor; // Use active color for everything

         for (let i = 0; i < bars; i++) {
            let peek = 0;
            if (freqData.length > 0) {
               // Map each bar to a spot in freqData
               const freqIdx = Math.floor((i / bars) * Math.min(freqData.length, 32)); // Use lower frequencies mostly
               peek = freqData[freqIdx] / 255;
            }
            const val = Math.max(0.05, peek);
            const barHeight = Math.min(1, val) * height;
            const x = i * barWidth;
            const y = (height - barHeight) / 2;
            
            const w = (barWidth - gap);
            const r = w / 2;
            if (w > 0) {
               ctx.beginPath();
               ctx.moveTo(x + r, y);
               ctx.lineTo(x + w - r, y);
               ctx.arcTo(x + w, y, x + w, y + r, r);
               ctx.lineTo(x + w, y + barHeight - r);
               ctx.arcTo(x + w, y + barHeight, x + w - r, y + barHeight, r);
               ctx.lineTo(x + r, y + barHeight);
               ctx.arcTo(x, y + barHeight, x, y + barHeight - r, r);
               ctx.lineTo(x, y + r);
               ctx.arcTo(x, y, x + r, y, r);
               ctx.fill();
            }
         }
      } else {
         // Playback Display Mode: Progress moving right
         let currentProgress = progress;
         if (isPlaying && audioCtxRef.current) {
            currentProgress = ((audioCtxRef.current.currentTime - startTimeRef.current) % durationSec) / durationSec;
            if (!seekingRef.current) {
              setProgress(currentProgress);
            }
         }

         const bars = staticWave.length || 40;
         const barWidth = width / bars;
         const barsToPlay = Math.floor(bars * currentProgress);
         
         for (let i = 0; i < bars; i++) {
            let val = staticWave[i] || 0.1;
            
            // Add live reactivity to the currently playing bar area
            if (isPlaying && freqData.length > 0 && Math.abs(i - barsToPlay) < 3) {
               const livePeak = freqData[Math.min(i, freqData.length - 1)] / 255;
               val = Math.max(val, livePeak * 0.8);
            }

            const barHeight = Math.min(1, val) * height;
            const x = i * barWidth;
            const y = (height - barHeight) / 2;
            
            ctx.fillStyle = i < barsToPlay ? playedColor : unplayedColor;
            ctx.beginPath();
            
            const w = (barWidth - gap);
            const r = w / 2;
            if (w > 0) {
               ctx.moveTo(x + r, y);
               ctx.lineTo(x + w - r, y);
               ctx.arcTo(x + w, y, x + w, y + r, r);
               ctx.lineTo(x + w, y + barHeight - r);
               ctx.arcTo(x + w, y + barHeight, x + w - r, y + barHeight, r);
               ctx.lineTo(x + r, y + barHeight);
               ctx.arcTo(x, y + barHeight, x, y + barHeight - r, r);
               ctx.lineTo(x, y + r);
               ctx.arcTo(x, y, x + r, y, r);
               ctx.fill();
            }
         }
      }

      if (isPlaying) {
         animationRef.current = requestAnimationFrame(draw);
      }
    };

    if (isPlaying) {
       draw();
    } else {
       // Draw once statically
       requestAnimationFrame(draw);
    }

    return () => {
       if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isMe, isDark, progress, isPlaying, staticWave, durationSec]);

  return (
    <div className={`flex items-center gap-3 ${stream ? 'w-full' : 'w-[220px]'}`}>
      {!stream && (
        <div
          onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
          title={isPlaying ? (t('systemPlayer.pause') === 'systemPlayer.pause' ? 'Pause' : t('systemPlayer.pause')) : (t('systemPlayer.play') === 'systemPlayer.play' ? 'Play' : t('systemPlayer.play'))}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 transition-transform active:scale-95 ${
              isMe 
              ? (isDark ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white/20 hover:bg-white/30 text-white shadow-sm") 
              : (isDark ? "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]" : "bg-orange-500 hover:bg-orange-600 text-white shadow-md")
          }`}
        >
          {isPlaying ? (
             <Pause size={18} className="fill-current" />
          ) : (
             <Play size={18} className="ml-1 fill-current" />
          )}
        </div>
      )}
      
      <div className="flex-1 flex flex-col justify-center">
         <canvas 
           ref={canvasRef} 
           className="w-full h-8 block"
         />
         {!stream && (
           <div className={`text-[10px] font-bold mt-1 tracking-wider ${isMe ? (isDark ? "text-orange-200" : "text-white/80") : (isDark ? "text-gray-500" : "text-slate-400")}`}>
             {duration}
           </div>
         )}
         {!stream && audioUrl && (
           <input
              data-testid="seek-slider"
              aria-label="Seek voice note"
              type="range"
              min={0}
              max={100}
              value={Math.round((progress || 0) * 100)}
              disabled={!isReady}
              onChange={(e) => {
                void handleSeek(Number(e.target.value) / 100);
              }}
              className={`mt-2 w-full h-1.5 rounded-full appearance-none cursor-pointer accent-orange-500 disabled:opacity-40 ${isDark ? "bg-white/10" : "bg-black/10"}`}
            />
         )}
      </div>
    </div>
  );
};
