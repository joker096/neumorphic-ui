import { useEffect, useRef, useState } from 'react';
import { fetchArrayBufferWithTimeout, isBlobUrl } from '../lib/network/fetchWithTimeout';
import { getVoiceBlob } from '../lib/voiceStore';

export function useVoiceWaveformAudio(
  audioUrl?: string,
  stream?: MediaStream | null,
  durationSec = 0,
  voiceId?: string | number,
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [staticWave, setStaticWave] = useState<number[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaStreamAudioSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
  const [speed, setSpeedState] = useState(1);
  const speedRef = useRef(1);

  useEffect(() => {
    let active = true;
    const initAudio = async () => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      if (stream) {
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;
        setIsPlaying(true);
      } else if (audioUrl) {
        // One deadline for connect, headers AND the body read: an inline
        // AbortController cleared right after the headers arrive covers only
        // the headers, so a stalled body could hang forever.
        let arrayBuffer: ArrayBuffer | undefined;
        try {
          const resp = await fetchArrayBufferWithTimeout(audioUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          arrayBuffer = resp.buffer;
        } catch {
          arrayBuffer = undefined;
        }
        if (arrayBuffer === undefined && isBlobUrl(audioUrl) && voiceId !== undefined && voiceId !== null && voiceId !== '') {
          // The object URL died (revoked after reload / player unmount). The
          // blob is persisted in IndexedDB, so silently rebuild a fresh URL —
          // no error surfacing for a source that is simply gone from memory.
          const blob = await getVoiceBlob(voiceId);
          if (!active) return;
          if (blob) {
            try {
              arrayBuffer = await blob.arrayBuffer();
            } catch {
              arrayBuffer = undefined;
            }
          }
        }
        if (arrayBuffer === undefined) {
          // Never synthesize audio: unavailable source must stay silent and be
          // surfaced as unavailable instead of playing noise.
          if (!active) return;
          setLoadError(true);
          setIsReady(false);
          return;
        }
        try {
          bufferRef.current = await ctx.decodeAudioData(arrayBuffer);
        } catch {
          if (!active) return;
          setLoadError(true);
          setIsReady(false);
          return;
        }
        if (!active) return;
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
  }, [durationSec, audioUrl, stream, voiceId]);

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
        peaks.push(Math.max(0.05, max * 5));
      }
      setStaticWave(peaks);
    } else {
      setStaticWave(Array.from({ length: 40 }, () => Math.random() * 0.5 + 0.1));
    }
  }, [bufferRef.current]);

  const startPlaybackAt = async (offset: number) => {
    if (!audioCtxRef.current || !bufferRef.current || !analyserRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    if (sourceRef.current) {
      if ('stop' in sourceRef.current) sourceRef.current.stop();
      sourceRef.current.disconnect();
    }
    const source = ctx.createBufferSource();
    source.buffer = bufferRef.current;
    if (source.playbackRate && typeof source.playbackRate === 'object') {
      source.playbackRate.value = speedRef.current;
    } else {
      (source as any).playbackRate = speedRef.current;
    }
    source.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);
    source.start(0, offset);
    startTimeRef.current = ctx.currentTime - offset;
    sourceRef.current = source;
    setIsPlaying(true);
    pausedAtRef.current = offset;
    const endDuration = durationSec;
    source.onended = () => {
      if (ctx.currentTime - startTimeRef.current >= endDuration - 0.1) {
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
    setProgress(clamped);
    pausedAtRef.current = nextOffset;
    if (isPlaying) {
      seekingRef.current = true;
      await startPlaybackAt(nextOffset);
      seekingRef.current = false;
    }
  };

  const changeSpeed = (next: number) => {
    const clamped = next > 0 ? next : 1;
    speedRef.current = clamped;
    setSpeedState(clamped);
    if (sourceRef.current && 'playbackRate' in sourceRef.current) {
      const active = sourceRef.current as any;
      if (active.playbackRate && typeof active.playbackRate === 'object') {
        active.playbackRate.value = clamped;
      } else {
        active.playbackRate = clamped;
      }
    }
  };

  const updateProgress = () => {
    if (seekingRef.current) return;
    if (!isPlaying || !audioCtxRef.current) return;
    const p = ((audioCtxRef.current.currentTime - startTimeRef.current) % durationSec) / durationSec;
    setProgress(p);
  };

  useEffect(() => {
    if (!isPlaying || stream || !durationSec) return;
    const tick = () => {
      if (!seekingRef.current && audioCtxRef.current) {
        const p = ((audioCtxRef.current.currentTime - startTimeRef.current) % durationSec) / durationSec;
        setProgress(p);
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, stream, durationSec]);

  return {
    isPlaying,
    progress,
    isReady,
    loadError,
    staticWave,
    analyserRef,
    audioCtxRef,
    startTimeRef,
    animationRef,
    togglePlayback,
    handleSeek,
    updateProgress,
    durationSec,
    speed,
    changeSpeed,
  };
}
