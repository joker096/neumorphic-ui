import { Shield, Lock, Zap, EyeOff, Key } from 'lucide-react';
import { useAppStore } from '../../store';
import { useAnimationsEnabled } from '../../contexts/AnimationContext';
import { motion } from 'motion/react';

/**
 * SecurityStatusBadge — shows a compact badge with current security status indicators.
 * Displays encryption status, anonymization status, and active security features.
 */
export const SecurityStatusBadge = () => {
  const stealthMode = useAppStore(s => s.stealthMode);
  const ghostViewMode = useAppStore(s => s.ghostViewMode);
  const anonymousMode = useAppStore(s => s.anonymousMode);
  const deliveryReceipts = useAppStore(s => s.deliveryReceipts);
  const readReceipts = useAppStore(s => s.readReceipts);
  const typingIndicators = useAppStore(s => s.typingIndicators);
  const onlineStatus = useAppStore(s => s.onlineStatus);
  const forwardAnonymization = useAppStore(s => s.forwardAnonymization);

  const activeSecurityFeatures = [
    { name: 'E2EE', icon: Lock, color: 'emerald' },
    { name: 'PQ', icon: Key, color: 'purple' },
    ...(stealthMode ? [{ name: 'STEALTH', icon: EyeOff, color: 'amber' }] : []),
    ...(ghostViewMode ? [{ name: 'GHOST', icon: EyeOff, color: 'cyan' }] : []),
    ...(anonymousMode ? [{ name: 'GHOST', icon: EyeOff, color: 'slate' }] : []),
    ...(forwardAnonymization ? [{ name: 'ANON', icon: Zap, color: 'slate' }] : []),
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeSecurityFeatures.map((feature, index) => {
        const Icon = feature.icon;
        const colorMap: Record<string, string> = {
          emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
          purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
          amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
          cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
          'red': 'bg-red-500/15 text-red-400 border-red-500/20',
          slate: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
        };

        return (
          <motion.div
            key={feature.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            whileHover={{ scale: 1.08 }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider border"
          >
            <Icon size={10} className="shrink-0" />
            <span className="shrink-0">{feature.name}</span>
          </motion.div>
        );
      })}

      {activeSecurityFeatures.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium tracking-wider border border-[var(--border-color)] text-[var(--text-tertiary)]"
        >
          <span>Default mode</span>
        </motion.div>
      )}
    </div>
  );
};

