import React, { useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useVoiceWaveformAudio } from '../../hooks/useVoiceWaveformAudio';

interface VoiceWaveformProps {
  duration?: string;
  isMe?: boolean;
  audioUrl?: string;
  stream?: MediaStream | null;
  isDark?: boolean;
}

export const VoiceWaveform = ({ duration = "0:12", isMe, audioUrl, stream, isDark }: VoiceWaveformProps) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const durationSec = duration ? duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0;

  const {
    isPlaying, progress, isReady, staticWave,
    analyserRef, audioCtxRef, startTimeRef, animationRef,
    togglePlayback, handleSeek, updateProgress,
  } = useVoiceWaveformAudio(audioUrl, stream, durationSec);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const gap = 2;
    const playedColor = isMe ? 'var(--waveform-played-self)' : 'var(--waveform-played-other)';
    const unplayedColor = isMe ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      let freqData = new Uint8Array(0);
      if (isPlaying && analyserRef.current) {
        freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(freqData);
      }

      if (stream) {
        const bars = 24;
        const barWidth = width / bars;
        ctx.fillStyle = playedColor;
        for (let i = 0; i < bars; i++) {
          let peek = 0;
          if (freqData.length > 0) {
            const freqIdx = Math.floor((i / bars) * Math.min(freqData.length, 32));
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
        let currentProgress = progress;
        if (isPlaying && audioCtxRef.current) {
          currentProgress = ((audioCtxRef.current.currentTime - startTimeRef.current) % durationSec) / durationSec;
        }
        updateProgress();

        const bars = staticWave.length || 40;
        const barWidth = width / bars;
        const barsToPlay = Math.floor(bars * currentProgress);

        for (let i = 0; i < bars; i++) {
          let val = staticWave[i] || 0.1;
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
      requestAnimationFrame(draw);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isMe, progress, isPlaying, staticWave, durationSec]);

  return (
    <div className={`flex items-center gap-3 ${stream ? 'w-full' : 'w-[220px]'}`}>
      {!stream && (
        <div
          onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
          title={isPlaying ? (t('systemPlayer.pause') === 'systemPlayer.pause' ? 'Pause' : t('systemPlayer.pause')) : (t('systemPlayer.play') === 'systemPlayer.play' ? 'Play' : t('systemPlayer.play'))}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 transition-transform active:scale-95 ${
              isMe
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
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
           <div className={`text-[10px] font-bold mt-1 tracking-wider ${isMe ? "text-orange-200" : "text-gray-500"}`}>
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
              className="mt-2 w-full h-1.5 rounded-full appearance-none cursor-pointer accent-orange-500 disabled:opacity-40 bg-[var(--bg-secondary)]"
           />
          )}
      </div>
    </div>
  );
};
