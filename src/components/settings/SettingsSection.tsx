import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

interface SettingsSectionProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  icon?: React.ElementType;
}

export const SettingsSection = ({ title, onBack, children, icon: Icon }: SettingsSectionProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    className="w-full flex-1 flex flex-col items-center min-h-0"
  >
    <div className="w-full max-w-full md:max-w-[640px] flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-3 shrink-0 pt-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-tertiary)]"
          style={{ touchAction: 'none' }}
        >
          <ChevronLeft size={20} className="text-[var(--text-primary)]" />
        </button>
        {Icon && <Icon size={20} className="shrink-0 text-orange-500" />}
        <h2 className="font-sans text-xl font-bold tracking-wide text-[var(--text-primary)]">
          {title}
        </h2>
      </div>
      <div className="w-full flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 pr-1 pb-4 flex flex-col gap-6 items-center">
        {children}
      </div>
    </div>
  </motion.div>
);
