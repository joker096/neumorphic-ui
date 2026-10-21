import { useMemo, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { SubView } from '../ui/SubView';
import { DataState } from '../ui/DataState';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneOff, Phone, Search, Trash2, Pause, X, Headphones } from 'lucide-react';
import { useAppStore } from '../../store';
import { callManager } from '../../lib/call/CallManager';
import { callRecorderService } from '../../lib/callRecorderService';
import { formatTime } from '../../utils/dateTime';
import { INLINE_HINT_CLASS } from '../ui/textClasses';

const SEARCH_CLASS =
  'w-full h-11 pl-10 pr-3 rounded-xl text-sm outline-none transition-colors bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] border border-[var(--border-color)] focus:border-[var(--accent)]';
const ROW_CLASS =
  'flex items-center gap-3 p-3 rounded-xl transition-colors bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--msg-bg-panel-hover)]';
const ICON_BTN_CLASS =
  'min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors';

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
    if (type === 'missed') return <PhoneMissed size={18} className="text-[var(--danger)]" />;
    if (type === 'declined') return <PhoneOff size={18} className="text-[var(--text-secondary)]" />;
    if (type === 'incoming') return <PhoneIncoming size={18} className="text-[var(--color-success)]" />;
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
              className={SEARCH_CLASS}
            />
          </div>
          {callHistory.length > 0 && (
            <button
              onClick={clearCallHistory}
              className={`p-3 min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]`}
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
                <div className={ROW_CLASS}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--msg-bg-panel)]">
                    {getIcon(call.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-[var(--text-primary)]">
                      {call.name}
                    </p>
                    <p className={INLINE_HINT_CLASS}>
                      <span>{call.at != null ? formatTime(call.at, lang) : call.time}{call.duration && ` · ${call.duration}`}</span>
                      {call.recordingId && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--danger)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" aria-hidden="true" />
                          {t('call.rec', 'REC')}
                        </span>
                      )}
                    </p>
                  </div>
                  {(call.type === 'missed' || call.type === 'declined') && (
                    <button
                      onClick={() => callManager.startPreviewCall(`cb_${call.id}`, call.name, 'audio').catch(() => {})}
                      className={`${ICON_BTN_CLASS} bg-[var(--msg-bg-panel)] text-[var(--text-secondary)] hover:bg-[var(--msg-bg-panel-hover)] hover:text-[var(--accent)] active:scale-95`}
                      title={t('call.callBack')}
                      aria-label={t('call.callBack')}
                    >
                      <Phone size={16} />
                    </button>
                  )}
                  {call.recordingId && (
                    <button
                      onClick={() => openRecording(call.recordingId!)}
                      className={`${ICON_BTN_CLASS} inline-flex gap-1.5 px-3 text-xs font-bold transition-all active:scale-[0.96] ${
                        playingId === call.recordingId
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
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
                  <div className="flex items-center gap-3 px-3 pt-2 pb-3 text-[var(--text-primary)]">
                    <audio
                      controls
                      src={blobUrl}
                      className="h-10 flex-1 min-w-0"
                      aria-label={t('call.playRecording')}
                    />
                    <button
                      onClick={closeRecording}
                      className={`${ICON_BTN_CLASS} text-[var(--text-secondary)] hover:bg-[var(--msg-bg-panel-hover)] hover:text-[var(--text-primary)] active:scale-95`}
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
