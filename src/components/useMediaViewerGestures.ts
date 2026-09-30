import React, { useCallback, useRef, useState } from 'react';

type GestureMode = 'idle' | 'nav' | 'pan' | 'pinch' | 'dismiss';

interface UseMediaViewerGesturesOptions {
  isPhoto: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function useMediaViewerGestures({ isPhoto, onClose, onPrev, onNext }: UseMediaViewerGesturesOptions) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const gestureRef = useRef<{
    mode: GestureMode;
    startX: number;
    startY: number;
    startDist: number;
    startScale: number;
    startOffset: { x: number; y: number };
    moved: boolean;
  }>({ mode: 'idle', startX: 0, startY: 0, startDist: 0, startScale: 1, startOffset: { x: 0, y: 0 }, moved: false });

  const lastTapRef = useRef(0);
  const scaleRef = useRef(1);

  const clamp = useCallback((v: number, min: number, max: number) => Math.min(Math.max(v, min), max), []);

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const toggleZoom = useCallback(() => {
    const next = scaleRef.current > 1 ? 1 : 2.5;
    scaleRef.current = next;
    setScale(next);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoom = useCallback((dir: 1 | -1) => {
    const next = clamp(scaleRef.current + dir * 0.5, 0.5, 4);
    scaleRef.current = next;
    setScale(next);
    if (next === 1) setOffset({ x: 0, y: 0 });
  }, [clamp]);

  const dist = (a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    const touches = e.touches;
    if (touches.length === 2) {
      g.mode = 'pinch';
      g.startDist = dist(touches[0], touches[1]);
      g.startScale = scaleRef.current;
      g.startOffset = offset;
      return;
    }
    if (touches.length === 1) {
      g.startX = touches[0].clientX;
      g.startY = touches[0].clientY;
      g.startOffset = offset;
      g.moved = false;
      g.mode = scaleRef.current > 1 ? 'pan' : 'nav';
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    if (g.mode === 'pinch' && e.touches.length >= 2) {
      const d = dist(e.touches[0], e.touches[1]);
      if (g.startDist > 0) {
        const next = clamp(g.startScale * (d / g.startDist), 1, 5);
        scaleRef.current = next;
        setScale(next);
        setOffset(next === 1 ? { x: 0, y: 0 } : g.startOffset);
      }
      return;
    }
    if ((g.mode === 'nav' || g.mode === 'dismiss') && e.touches.length === 1) {
      const dx = e.touches[0].clientX - g.startX;
      const dy = e.touches[0].clientY - g.startY;
      if (Math.hypot(dx, dy) > 8) g.moved = true;
      if (!g.moved) return;
      setOffset({ x: dx, y: dy });
      if (Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) g.mode = 'dismiss';
      else if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.5) g.mode = 'nav';
    } else if (g.mode === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - g.startX;
      const dy = e.touches[0].clientY - g.startY;
      if (Math.hypot(dx, dy) > 8) g.moved = true;
      if (!g.moved) return;
      const maxX = Math.max(0, (window.innerWidth * scaleRef.current - window.innerWidth) / 2);
      const maxY = Math.max(0, (window.innerHeight * scaleRef.current - window.innerHeight) / 2);
      setOffset({
        x: clamp(g.startOffset.x + dx, -maxX, maxX),
        y: clamp(g.startOffset.y + dy, -maxY, maxY),
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const g = gestureRef.current;
    const t0 = e.changedTouches[0] ?? e.touches[0];
    if (!t0) {
      g.mode = 'idle';
      return;
    }
    const dx = t0.clientX - g.startX;
    const dy = t0.clientY - g.startY;
    const now = Date.now();
    const isTap = !g.moved && Math.hypot(dx, dy) < 12;

    if (g.mode === 'pinch') {
      if (scaleRef.current === 1) setOffset({ x: 0, y: 0 });
      g.mode = 'idle';
      return;
    }

    if (isTap) {
      g.mode = 'idle';
      if (isPhoto) {
        if (now - lastTapRef.current < 300) {
          lastTapRef.current = 0;
          toggleZoom();
        } else {
          lastTapRef.current = now;
        }
      } else {
        lastTapRef.current = now;
      }
      return;
    }

    const prevMode = g.mode;
    g.mode = 'idle';
    if (prevMode === 'pan' || scaleRef.current > 1) {
      setOffset((p) => ({ ...p }));
      return;
    }
    setOffset({ x: 0, y: 0 });
    const wasDismiss = prevMode === 'dismiss';
    if (wasDismiss && dy > 80) {
      onClose();
    } else if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onNext?.();
      else onPrev?.();
    } else if (Math.abs(dy) > 110 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      onClose();
    }
  };

  return { scale, offset, resetZoom, toggleZoom, zoom, onTouchStart, onTouchMove, onTouchEnd };
}