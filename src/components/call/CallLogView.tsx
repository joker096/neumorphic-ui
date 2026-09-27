import { useMemo, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { SubView } from '../ui/SubView';
import { DataState } from '../ui/DataState';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Phone, Search, Trash2, Play, Pause, X, Headphones } from 'lucide-react';
import { useAppStore } from '../../store';
import { callManager } from '../../lib/call/CallManager';
import { callRecorderService } from '../../lib/callRecorderService';
import { formatTime } from '../../utils/dateTime';

export const CallLogView = ({ isDark = false, onBack, onOpenContacts }: { isDark?: boolean; onBack?: () => void; onOpenContacts?: () => void }) => {
  const { t, lang } = useI18n();
  const callHistory = useAppStore(s => s.callHistory);
  const clearCallHistory = useAppStore(s => s.clearCallHistory);
  const [query, setQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query) return callHistory;
    const q = query.toLowerCase();
    return callHistory.filter(c => c.name.toLowerCase().includes(q));
  }, [callHistory, query]);

  const getIcon = (type: string) => {
    if (type === 'missed') return <PhoneMissed size={18} className="text-red-400" />;
    if (type === 'declined') return <PhoneOff size={18} className="text-gray-400" />;
    if (type === 'incoming') return <PhoneIncoming size={18} className="text-emerald-400" />;
    return <PhoneOutgoing size={18} className="text-[var(--accent)]" />;
  };

  const closeRecording = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setPlayingId(null);
  };

  const openRecording = async (recordingId: string) => {
    if (playingId === recordingId) {
      closeRecording();
      return;
    }
    try {
      const blob = await callRecorderService.getRecordingBlob(recordingId);
      if (!blob) return;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(URL.createObjectURL(blob));
      setPlayingId(recordingId);
    } catch {
      /* recording blob missing — playback stays closed */
    }
  };

  return (
    <SubView title={t('call.callHistory')} isDark={isDark} onBack={onBack || (() => {})}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('call.searchCalls')}
              aria-label={t('call.searchCalls')}
              className={`w-full h-11 pl-10 pr-3 rounded-xl text-sm outline-none transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-gray-500' : 'bg-white text-slate-800 placeholder:text-slate-400'}`}
            />
          </div>
          {callHistory.length > 0 && (
            <button
              onClick={clearCallHistory}
              className={`p-3 min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400' : 'bg-gray-100 text-slate-600 hover:bg-red-50 hover:text-red-500'}`}
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
            emptyIcon={callHistory.length === 0 ? undefined : 'search'}
            title={callHistory.length === 0 ? t('call.noCallsYet') : t('call.noCallsMatch')}
            description={t('call.noCallsSubtitle')}
            action={query ? { label: t('search.clear', 'Clear'), onClick: () => setQuery('') } : onOpenContacts ? { label: t('call.viewContacts', 'View contacts'), onClick: onOpenContacts } : undefined}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((call) => (
              <div key={call.id}>
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-secondary)] hover:bg-white/5' : 'bg-white hover:bg-gray-50 border border-gray-100'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                    {getIcon(call.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>
                      {call.name}
                    </p>
                    <p className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      <span>{call.at != null ? formatTime(call.at, lang) : call.time}{call.duration && ` · ${call.duration}`}</span>
                      {call.recordingId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
                          {t('call.rec', 'REC')}
                        </span>
                      )}
                    </p>
                  </div>
                  {(call.type === 'missed' || call.type === 'declined') && (
                    <button
                      onClick={() => callManager.startPreviewCall(`cb_${call.id}`, call.name, 'audio').catch(() => {})}
                      className={`min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent)]' : 'bg-gray-100 text-slate-500 hover:text-[var(--accent)]'}`}
                      title={t('call.callBack')}
                      aria-label={t('call.callBack')}
                    >
                      <Phone size={16} />
                    </button>
                  )}
                  {call.recordingId && (
                    <button
                      onClick={() => openRecording(call.recordingId!)}
                      className={`min-w-11 min-h-11 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-[0.96] ${
                        playingId === call.recordingId
                          ? (isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-100 text-sky-600')
                          : 'bg-[var(--accent)] text-[var(--ink-on-saturate)] hover:brightness-110'
                      }`}
                      title={t('call.playRecording')}
                      aria-label={t('call.playRecording')}
                    >
                      {playingId === call.recordingId ? <Pause size={16} /> : <Headphones size={16} />}
                      <span className="hidden sm:inline">{t('call.playRecording')}</span>
                    </button>
                  )}
                </div>
                {playingId === call.recordingId && blobUrl && (
                  <div className={`flex items-center gap-3 px-3 pt-2 pb-3 ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>
                    <audio
                      controls
                      src={blobUrl}
                      className="h-10 flex-1 min-w-0"
                      aria-label={t('call.playRecording')}
                    />
                    <button
                      onClick={closeRecording}
                      className={`min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors ${isDark ? 'text-[var(--text-secondary)] hover:bg-white/5' : 'text-slate-500 hover:bg-gray-100'}`}
                      aria-label={t('common.close')}
                      title={t('common.close')}
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SubView>
  );
};
