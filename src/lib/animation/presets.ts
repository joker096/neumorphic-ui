import type { Transition } from 'motion/react';

type SpringPreset = Transition;

export const springs: Record<string, SpringPreset> = {
  soft: { type: "spring", stiffness: 200, damping: 25, mass: 1 },
  snappy: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 },
  bouncy: { type: "spring", stiffness: 150, damping: 15, mass: 1 },
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
};

export const iosEase = { ease: [0.25, 0.1, 0.25, 1], duration: 0.35 };
