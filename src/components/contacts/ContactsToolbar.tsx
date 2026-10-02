import { Scan, QrCode, UserPlus, Share } from "lucide-react";
import { motion } from "motion/react";

type T = (key: string, options?: any) => string;

interface ContactsToolbarProps {
  isDark: boolean;
  t: T;
  onScan: () => void;
  onShare: () => void;
  onAdd: () => void;
  onInvite: () => void;
}
export function ContactsToolbar({ isDark, t, onScan, onShare, onAdd, onInvite }: ContactsToolbarProps) {
  return (
    <div className="w-full flex items-center justify-between gap-2 mb-4 px-2">
      <h2 className={`font-sans text-sm sm:text-base font-bold tracking-wide truncate min-w-0 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
        {t('contacts.title')}
      </h2>
      <div className="flex gap-1.5 sm:gap-2 text-[var(--accent)] shrink-0">
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={onScan}
          title={t('contacts.scanContactQR')}
          className="min-w-11 min-h-11 flex items-center justify-center hover:opacity-80 transition-all">
          <Scan size={24} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={onShare}
          title={t('contacts.shareIdentity')}
          className="min-w-11 min-h-11 flex items-center justify-center hover:opacity-80 transition-all">
          <QrCode size={24} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          title={t('contacts.addContact')}
          className="min-w-11 min-h-11 flex items-center justify-center hover:opacity-80 transition-all">
          <UserPlus size={24} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={onInvite}
          title={t('onboarding.invite')}
          className="min-w-11 min-h-11 flex items-center justify-center hover:opacity-80 transition-all">
          <Share size={24} />
        </motion.button>
      </div>
    </div>
  );
}
