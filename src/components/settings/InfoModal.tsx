import { AppModal } from '../ui/AppModal';

interface InfoModalProps {
  isOpen: boolean;
  isDark: boolean;
  title: string;
  children: React.ReactNode;
  actionLabel: string;
  actionColor?: 'emerald' | 'amber';
  onClose: () => void;
  onAction: () => void;
  t: (key: string) => string;
}

export function InfoModal({ isOpen, isDark, title, children, actionLabel, actionColor = 'emerald', onClose, onAction, t }: InfoModalProps) {
  const btnColor = actionColor === 'emerald'
    ? 'bg-emerald-500 hover:bg-emerald-600 text-[var(--text-primary)]'
    : 'bg-amber-500 hover:bg-amber-600 text-[var(--text-primary)]';

  return (
    <AppModal isOpen={isOpen} onClose={onClose} isDark={isDark} title={title}>
      <div className={`text-sm leading-relaxed space-y-3 mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        {children}
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${isDark ? 'bg-white/10 hover:bg-white/20 text-[var(--text-primary)]' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
          {t('common.close')}
        </button>
        <button onClick={() => { onClose(); onAction(); }} className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${btnColor}`}>
          {actionLabel}
        </button>
      </div>
    </AppModal>
  );
}




