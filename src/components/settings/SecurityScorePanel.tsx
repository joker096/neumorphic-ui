import { Shield, Lock, Zap, EyeOff, Key, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store';

interface SecurityCheck {
  id: string;
  title: string;
  icon: typeof Shield;
  status: 'secure' | 'partial' | 'at-risk';
}

/**
 * SecurityScorePanel — simplified security overview.
 * Shows a clean score indicator and key security status items only.
 */
export const SecurityScorePanel = () => {
  const appLockHashedPIN = useAppStore(s => s.appLockHashedPIN);
  const stealthMode = useAppStore(s => s.stealthMode);
  const ghostViewMode = useAppStore(s => s.ghostViewMode);
  const anonymousMode = useAppStore(s => s.anonymousMode);
  const readReceipts = useAppStore(s => s.readReceipts);
  const typingIndicators = useAppStore(s => s.typingIndicators);
  const onlineStatus = useAppStore(s => s.onlineStatus);
  const forwardAnonymization = useAppStore(s => s.forwardAnonymization);

  const checks: SecurityCheck[] = [
    {
      id: 'encryption',
      title: 'E2E Encryption',
      icon: Lock,
      status: 'secure',
    },
    {
      id: 'pq',
      title: 'Post-Quantum',
      icon: Key,
      status: 'secure',
    },
    {
      id: 'device',
      title: 'Device Lock',
      icon: Lock,
      status: appLockHashedPIN ? 'secure' : 'at-risk',
    },
    {
      id: 'stealth',
      title: 'Stealth Mode',
      icon: EyeOff,
      status: stealthMode ? 'secure' : 'at-risk',
    },
    {
      id: 'metadata',
      title: 'Metadata Kill',
      icon: EyeOff,
      status: !readReceipts && !typingIndicators && !onlineStatus ? 'secure' : 'partial',
    },
    {
      id: 'forwarding',
      title: 'Forward Anon',
      icon: Zap,
      status: forwardAnonymization ? 'secure' : 'partial',
    },
  ];

  const secureCount = checks.filter(c => c.status === 'secure').length;
  const totalCount = checks.length;
  const score = Math.round((secureCount / totalCount) * 100);

  const scoreColor = score >= 75
    ? 'text-emerald-400'
    : score >= 50
      ? 'text-amber-400'
      : 'text-red-400';

  const scoreBg = score >= 75
    ? 'border-emerald-500/30 bg-emerald-500/10'
    : score >= 50
      ? 'border-amber-500/30 bg-amber-500/10'
      : 'border-red-500/30 bg-red-500/10';

  const scoreLabel = score >= 75
    ? 'Strong'
    : score >= 50
      ? 'Moderate'
      : 'Weak';

  return (
    <div className="flex flex-col gap-4">
      {/* Score — clean, minimal */}
      <div className="flex items-center gap-3">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border ${scoreBg}`}>
          <div className="text-center">
            <div className={`text-xl font-bold ${scoreColor}`}>{score}</div>
          </div>
        </div>
        <div>
          <div className={`text-base font-bold ${scoreColor}`}>{scoreLabel} Security</div>
          <div className="text-xs text-[var(--text-tertiary)]">{secureCount}/{totalCount} secured</div>
        </div>
      </div>

      {/* Checks — compact, no badges */}
      <div className="flex flex-col gap-1.5">
        {checks.map((check, index) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: index * 0.04 }}
            className={`flex items-center gap-2.5 px-2 py-1.5 rounded`}
          >
            <check.icon size={14} className={`shrink-0 ${
              check.status === 'secure'
                ? 'text-emerald-400'
                : check.status === 'partial'
                  ? 'text-amber-400'
                  : 'text-red-400'
            }`} />
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium ${
                check.status === 'secure'
                  ? 'text-[var(--text-primary)]'
                  : check.status === 'partial'
                    ? 'text-amber-300'
                    : 'text-red-300'
              }`}>{check.title}</div>
            </div>
            <div className={`text-[9px] font-bold uppercase tracking-wide ${
              check.status === 'secure'
                ? 'text-emerald-400/70'
                : check.status === 'partial'
                  ? 'text-amber-400/70'
                  : 'text-red-400/70'
            }`}>
              {check.status === 'secure' ? 'OK' : check.status === 'partial' ? 'PARTIAL' : 'RISK'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
