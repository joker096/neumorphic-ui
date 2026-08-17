import { useI18n } from '../lib/i18n';
import { SubView } from './ui/SubView';
import { Mic, Search, SlidersHorizontal } from 'lucide-react';

export const RecordingsScreen = ({ isDark = false, onBack }: { isDark?: boolean; onBack?: () => void }) => {
  const { t } = useI18n();

  return (
    <SubView title={t('recordings.title', 'Recordings')} isDark={isDark} onBack={onBack || (() => {})}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder={t('recordings.searchPlaceholder', 'Search recordings...')}
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-gray-500' : 'bg-white text-slate-800 placeholder:text-slate-400'}`}
            />
          </div>
          <button className={`p-2.5 rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className={`flex flex-col items-center justify-center py-16 px-4 rounded-xl ${isDark ? 'bg-[var(--bg-secondary)]' : 'bg-gray-50'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
            <Mic size={28} className={isDark ? 'text-gray-500' : 'text-slate-400'} />
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            {t('recordings.empty', 'Your call recordings will appear here')}
          </p>
        </div>
      </div>
    </SubView>
  );
};
