import { motion, AnimatePresence } from "motion/react";
import { Maximize, Minimize, Users } from "lucide-react";
import { StatusDots } from "./CallControls";
import { CALL_DEMO_BADGE_LABEL } from "../../constants/callConstants";

interface CallTopBarProps {
  showControls: boolean;
  remoteName: string;
  isGroup: boolean;
  participantCount: number;
  statusLabel: string;
  elapsed: number;
  status: string;
  isPreview: boolean;
  isRecording: boolean;
  t: (key: string, options?: any) => string;
  isVideo: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onMinimize?: () => void;
}

export const CallTopBar: React.FC<CallTopBarProps> = ({
  showControls, remoteName, isGroup, participantCount, statusLabel, elapsed,
  status, isPreview, isRecording, t, isVideo, isFullscreen, toggleFullscreen, onMinimize,
}) => (
  <AnimatePresence>
    {showControls && (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 p-4 sm:p-6 pointer-events-none flex items-start justify-between gap-3"
      >
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--border-color)] shadow-lg">
            <div className="flex items-center gap-2">
              <h2 className="text-[var(--text-primary)] text-base sm:text-xl font-bold tracking-tight">
                {remoteName}
              </h2>
              {isGroup && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  <Users size={11} /> {participantCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:ml-1">
              <span className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium capitalize tracking-wide">
                {statusLabel}
              </span>
              {status === 'connected' && (
                <span className="text-[var(--text-tertiary)] text-xs sm:text-sm font-mono tabular-nums">
                  {formatDuration(elapsed)}
                </span>
              )}
              {status === 'connecting' && <StatusDots />}
              {isPreview && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  {CALL_DEMO_BADGE_LABEL}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--danger)]/15 backdrop-blur-md border border-[var(--danger)]/30"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--danger)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--danger)]" />
                </span>
                <span className="text-xs font-bold text-[var(--danger)] tracking-wider">{t('call.recording')}</span>
              </motion.div>
            )}
          </AnimatePresence>
          {isVideo && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="neo-circle w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title={t('call.fullscreen')}
              aria-label={t('call.fullscreen')}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
          {onMinimize && (
            <button
              onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              className="neo-circle w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title={t('call.minimize')}
              aria-label={t('call.minimize')}
            >
              <Minimize size={18} className="rotate-45" />
            </button>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}
