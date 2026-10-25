import React from "react";
import { motion, useDragControls, type PanInfo } from "motion/react";
import { useCoarsePointer } from "../../hooks/useCoarsePointer";

/** Downward drag distance (px) past which the panel closes. */
export const SWIPE_DISMISS_THRESHOLD = 80;
/** Downward velocity (px/s) which closes the panel regardless of distance. */
export const SWIPE_DISMISS_VELOCITY = 500;

/** Pure decision: a pull-down gesture closes when it passes the distance
 *  threshold or the downward velocity threshold (fast flick closes even when
 *  the drag path is short). */
export function shouldSwipeDismiss(
  offsetY: number,
  velocityY: number,
  threshold: number = SWIPE_DISMISS_THRESHOLD,
  velocity: number = SWIPE_DISMISS_VELOCITY,
): boolean {
  return offsetY > threshold || velocityY > velocity;
}

interface SwipeDismissPanelProps {
  /** Called when a pull-down gesture crosses the threshold. */
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile pull-down-to-dismiss wrapper for composer popovers (sticker picker,
 * schedule popup, attach menu). The grab handle at the top initiates the drag —
 * the rest of the panel stays fully scrollable and text-selectable. A downward
 * drag past `SWIPE_DISMISS_THRESHOLD` or with enough velocity closes the panel;
 * otherwise it springs back. The gesture is only active on coarse (touch)
 * pointers; on mouse-first devices the panel behaves as before.
 */
export function SwipeDismissPanel({ onClose, children, className }: SwipeDismissPanelProps) {
  const coarse = useCoarsePointer();
  const controls = useDragControls();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 48 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      className={className}
      drag={coarse ? "y" : false}
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.45 }}
      onDragEnd={(_e: unknown, info: PanInfo) => {
        if (shouldSwipeDismiss(info.offset.y, info.velocity.y)) {
          onClose();
        }
      }}
    >
      {coarse && (
        <div
          aria-hidden="true"
          onPointerDown={(e) => controls.start(e)}
          className="mx-auto flex h-11 w-full items-center justify-center cursor-grab touch-none active:cursor-grabbing"
        >
          <span className="h-1 w-10 rounded-full bg-[var(--text-tertiary)]/40" />
        </div>
      )}
      {children}
    </motion.div>
  );
}
