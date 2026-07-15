import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

interface AnimationContextValue {
  enabled: boolean;
  reducedMotion: boolean;
  duration: number;
}

const AnimationContext = createContext<AnimationContextValue>({
  enabled: true,
  reducedMotion: false,
  duration: 0.3,
});

export function AnimationProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const mqlRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_ui_animations');
      setEnabled(stored === null ? true : stored === 'true');
    } catch {
      setEnabled(true);
    }
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    mqlRef.current = mql;
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const value: AnimationContextValue = {
    enabled,
    reducedMotion: reducedMotion || !enabled,
    duration: reducedMotion || !enabled ? 0 : 0.3,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation(): AnimationContextValue {
  return useContext(AnimationContext);
}

export const useAnimationsEnabled = (): boolean => {
  const { reducedMotion } = useAnimation();
  return !reducedMotion;
};

export function useAnimationDuration(fast = false): number {
  const { duration, reducedMotion } = useAnimation();
  if (reducedMotion) return 0;
  return fast ? Math.min(duration, 0.15) : duration;
}
