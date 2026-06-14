import type { Variants } from 'motion/react';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.15 } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 350, damping: 30 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 350, damping: 26 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.12 } },
};

export const navPush: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 32 } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.15 } },
};

export const navPop: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 32 } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.15 } },
};
