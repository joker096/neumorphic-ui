import { useMemo, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { SubView } from '../ui/SubView';
import { DataState } from '../ui/DataState';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store';

export const CallLogView = ({ isDark = false, onBack }: { isDark?: boolean; onBack?: () => void }) => {
  const { t } = useI18n();
  const callHistory = useAppStore(s => s.callHistory);
  const clearCallHistory = useAppStore(s => s.clearCallHistory);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query) return callHistory;
    const q = query.toLowerCase();
    return callHistory.filter(c => c.name.toLowerCase().includes(q));
  }, [callHistory, query]);

  const getIcon = (type: string) => {
    if (type === 'missed') return <PhoneMissed size={18} className="text-red-400" />;
    if (type === 'incoming') return <PhoneIncoming size={18} className="text-emerald-400" />;
    return <PhoneOutgoing size={18} className="text-blue-400" />;
  };

  return (
    <SubView title={t('call.callHistory')} isDark={isDark} onBack={onBack || (() => {})}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('call.searchCalls')}
              className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-gray-500' : 'bg-white text-slate-800 placeholder:text-slate-400'}`}
            />
          </div>
          {callHistory.length > 0 && (
            <button
              onClick={clearCallHistory}
              className={`p-2.5 rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400' : 'bg-gray-100 text-slate-600 hover:bg-red-50 hover:text-red-500'}`}
              title={t('call.clearAll')}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <DataState
            status="empty"
            isDark={isDark}
            title={callHistory.length === 0 ? t('call.noCallsYet') : t('call.noCallsSubtitle')}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((call) => (
              <div
                key={call.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] hover:bg-white/5' : 'bg-white hover:bg-gray-50 border border-gray-100'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {getIcon(call.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>
                    {call.name}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                    {call.time}
                    {call.duration && ` · ${call.duration}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SubView>
  );
};
