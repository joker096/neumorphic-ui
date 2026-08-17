import { AppModal } from '../ui/AppModal';
import { Button } from '../ui/Button';

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
  return (
    <AppModal isOpen={isOpen} onClose={onClose} isDark={isDark} title={title}>
      <div className={`text-sm leading-relaxed space-y-3 mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
        {children}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
          {t('common.close')}
        </Button>
        <Button variant="primary" size="md" className="flex-1" onClick={() => { onClose(); onAction(); }}>
          {actionLabel}
        </Button>
      </div>
    </AppModal>
  );
}




