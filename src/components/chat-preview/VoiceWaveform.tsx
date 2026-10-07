import React, { useEffect, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useVoiceWaveformAudio } from '../../hooks/useVoiceWaveformAudio';
import { useAppStore } from '../../store';
import { Avatar } from '../ui/Avatar';

interface VoiceWaveformProps {
  duration?: string;
  isMe?: boolean;
  audioUrl?: string;
  stream?: MediaStream | null;
  isDark?: boolean;
  name?: string;
}

export const VoiceWaveform = ({ duration = "0:12", isMe, audioUrl, stream, isDark, name }: VoiceWaveformProps) => {
  const { t } = useI18n();
  const contactAvatars = useAppStore((s) => s.contactAvatars);
  const userProfile = useAppStore((s) => s.userProfile);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const durationSec = duration ? duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : 0;
  const widthClass = stream
    ? 'w-full'
    : durationSec < 15
      ? 'w-[170px]'
      : durationSec < 45
        ? 'w-[220px]'
        : durationSec < 120
          ? 'w-[280px]'
          : 'w-[320px]';

  const {
    isPlaying, progress, isReady, loadError, staticWave,
    analyserRef, audioCtxRef, startTimeRef, animationRef,
    togglePlayback, handleSeek, speed, changeSpeed,
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
    const unplayedColor = isMe ? 'var(--waveform-unplayed-self)' : 'var(--waveform-unplayed-other)';

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

  const remainingSec = Math.max(0, Math.floor(durationSec - (progress || 0) * durationSec));
  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const timeLabel = isPlaying || progress > 0.001 ? formatClock(remainingSec) : duration;
  const colorCls = isMe ? (isDark ? "text-emerald-200" : "text-emerald-600") : isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]";
  const avatarSrc = isMe ? userProfile?.avatar : contactAvatars?.[String(name ?? "")];
  const nextSpeed = speed >= 2 ? 1 : speed >= 1.5 ? 2 : 1.5;
  const handleCanvasSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && isReady) void handleSeek((e.clientX - rect.left) / rect.width);
  };

  return (
    <div className={`flex items-center gap-3 max-w-full ${widthClass}`}>
      {!stream && name && (
        <Avatar name={name} src={avatarSrc} size="sm" className="shrink-0" />
      )}
      {!stream && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (isReady) togglePlayback(); }}
          disabled={!isReady}
          aria-label={loadError ? t('chat.voiceUnavailable', 'Voice message unavailable') : !isReady ? t('chat.voiceLoading', 'Loading') : isPlaying ? t('systemPlayer.pause') : t('systemPlayer.play')}
          title={loadError ? t('chat.voiceUnavailable', 'Voice message unavailable') : !isReady ? t('chat.voiceLoading', 'Loading') : isPlaying ? t('systemPlayer.pause') : t('systemPlayer.play')}
          className={`min-w-11 min-h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
            isReady ? 'cursor-pointer' : 'cursor-default opacity-50'
          } ${
              isMe
              ? "bg-white/20 hover:bg-white/30 text-[var(--text-primary)]"
              : "bg-[var(--accent)] hover:brightness-110 text-[var(--ink-on-saturate)] shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)]"
          }`}
        >
          {!isReady && !loadError ? (
            <Loader2 className="animate-spin" size={18} />
          ) : isPlaying ? (
             <Pause size={18} className="fill-current" />
          ) : (
             <Play size={18} className="ml-1 fill-current" />
          )}
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center">
         <canvas
           ref={canvasRef}
           className={`w-full h-8 block${!stream && isReady ? ' cursor-pointer' : ''}`}
           onClick={!stream && isReady ? handleCanvasSeek : undefined}
         />
         {!stream && (
           <div className="flex items-center gap-2 mt-1">
             {!isMe && (progress || 0) < 0.001 && !isPlaying && (
               <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--accent)]" />
             )}
             <div className={`text-xs font-bold tracking-wider tabular-nums ${colorCls}`}>
               {timeLabel}
             </div>
             <span className="flex-1" />
             {isReady && !loadError && (
               <button
                 type="button"
                 onClick={(e) => { e.stopPropagation(); changeSpeed(nextSpeed); }}
                 aria-label={t('a11y.playbackSpeed', 'Playback speed')}
                 title={t('a11y.playbackSpeed', 'Playback speed')}
                 className="min-w-11 min-h-11 px-2 rounded-full text-xs font-bold text-[var(--text-secondary)] hover:bg-white/10 flex items-center justify-center"
               >
                 {Number.isInteger(speed) ? `${speed}×` : `${speed.toFixed(1)}×`}
               </button>
             )}
           </div>
         )}
         {!stream && loadError && (
           <div className="text-xs font-medium mt-1 text-rose-400">{t('chat.voiceUnavailable', 'Voice message unavailable')}</div>
         )}
         {!stream && !loadError && audioUrl && (
            <input
               data-testid="seek-slider"
               aria-label={t("a11y.seekVoiceNote")}
               type="range"
               min={0}
               max={100}
               value={Math.round((progress || 0) * 100)}
               disabled={!isReady}
               onChange={(e) => {
                 void handleSeek(Number(e.target.value) / 100);
               }}
               className="voice-seek mt-2 w-full disabled:opacity-40"
               style={{ "--seek-progress": `${Math.round((progress || 0) * 100)}%` } as React.CSSProperties}
            />
          )}
      </div>
    </div>
  );
};

