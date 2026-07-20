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
  if (!isOpen) return null;
  const btnColor = actionColor === 'emerald'
    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
    : 'bg-amber-500 hover:bg-amber-600 text-white';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl p-6 border ${isDark ? 'bg-[#1a1d24] border-white/10' : 'bg-white border-black/10'}`}>
        <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
        <div className={`text-sm leading-relaxed space-y-3 mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {children}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
            {t('common.close')}
          </button>
          <button onClick={() => { onClose(); onAction(); }} className={`flex-1 h-11 rounded-2xl text-sm font-bold transition-colors active:scale-95 ${btnColor}`}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
