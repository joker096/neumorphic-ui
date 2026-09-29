import { motion, AnimatePresence } from "motion/react";
import { Maximize, Minimize, Users } from "lucide-react";
import { StatusDots } from "./CallControls";
import { CALL_DEMO_BADGE_LABEL, CALL_DEFAULT_INITIAL, CALL_NETWORK_QUALITY_COLORS, CALL_NETWORK_QUALITY_MS } from "../../constants/callConstants";

interface CallTopBarProps {
  showControls: boolean;
  remoteName: string;
  isGroup: boolean;
  participantCount: number;
  statusLabel: string;
  elapsed: number;
  status: string;
  latencyMs: number;
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
  status, latencyMs, isPreview, isRecording, t, isVideo, isFullscreen, toggleFullscreen, onMinimize,
}) => (
  <AnimatePresence>
    {showControls && (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute top-0 left-0 right-0 p-3 sm:p-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(1rem+env(safe-area-inset-top,0px))] pl-[calc(0.75rem+env(safe-area-inset-left,0px))] pr-[calc(0.75rem+env(safe-area-inset-right,0px))] pointer-events-none flex items-start justify-between gap-3"
      >
        <div className="pointer-events-auto flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-[var(--accent)]/30 shrink-0">
            {remoteName.charAt(0).toUpperCase() || CALL_DEFAULT_INITIAL}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-white text-sm sm:text-base font-bold tracking-tight truncate">
                {remoteName}
              </h2>
              {isGroup && (
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/15 text-white shrink-0">
                  <Users size={12} /> {participantCount}
                </span>
              )}
              {isPreview && (
                <span className="text-[11px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/15 text-white shrink-0">
                  {CALL_DEMO_BADGE_LABEL}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[11px] sm:text-xs font-medium tracking-wide ${status === 'error' ? 'text-[var(--danger)]' : 'text-white/70 capitalize'}`}>
                {statusLabel}
              </span>
              {status === 'connected' && (
                <span className="text-white/50 text-[11px] sm:text-xs font-mono tabular-nums">
                  {formatDuration(elapsed)}
                </span>
              )}
              {(status === 'connecting' || status === 'reconnecting') && <StatusDots />}
              <NetworkQualityBars latencyMs={latencyMs} t={t} />
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
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--danger)]/20 backdrop-blur-xl border border-[var(--danger)]/40"
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
              className="neo-circle w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title={t('call.fullscreen')}
              aria-label={t('call.fullscreen')}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
          {onMinimize && (
            <button
              onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              className="neo-circle w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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

const NetworkQualityBars: React.FC<{ latencyMs: number; t: (key: string, options?: any) => string }> = ({ latencyMs, t }) => {
  const level = latencyMs < CALL_NETWORK_QUALITY_MS.good ? 3 : latencyMs < CALL_NETWORK_QUALITY_MS.fair ? 2 : 1;
  const title = t(level === 3 ? 'call.networkQualityGood' : level === 2 ? 'call.networkQualityFair' : 'call.networkQualityPoor');
  return (
    <span className="flex items-end gap-0.5 h-3.5" title={title} aria-label={title}>
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={`w-1 rounded-full ${bar <= level ? CALL_NETWORK_QUALITY_COLORS[level] : 'bg-white/20'}`}
          style={{ height: `${4 + bar * 2}px` }}
        />
      ))}
    </span>
  );
};

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}
