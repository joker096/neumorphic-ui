import { useState, useCallback } from "react";

export interface RippleEffectState {
  rippleState: { x: number; y: number; active: boolean };
}

export interface RippleEffectActions {
  setRippleState: (v: { x: number; y: number; active: boolean }) => void;
  createRipple: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const useRippleEffect = (): RippleEffectState & RippleEffectActions => {
  const [rippleState, setRippleState] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const createRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRippleState({ x, y, active: true });
    setTimeout(() => setRippleState({ x: 0, y: 0, active: false }), 600);
  }, []);

  return {
    rippleState,
    setRippleState,
    createRipple,
  };
};
