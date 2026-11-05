import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './PhotoLightbox.module.css';

export function PhotoLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className={styles.root}
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close photo">
            <X size={24} strokeWidth={2} />
          </button>
          <motion.img
            src={src}
            alt=""
            className={styles.image}
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            onClick={(event) => event.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
