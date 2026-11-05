import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import styles from './ScreenTransition.module.css';

/** 250 ms push: new screen slides in from the right while the old one leaves. */
export function ScreenTransition({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
