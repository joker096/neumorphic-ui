import React, { useState } from 'react';
import { Bell, BellOff, Plus } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { toast } from '../ui/Toast';
import { ChatPickerModal } from '../payments/ChatPickerModal';

interface NotifyException {
  id: string | number;
  name: string;
  muted: boolean;
}

interface NotificationsExceptionsProps {
  isDark?: boolean;
}

/**
 * Per-chat overrides of the global notification rules. Self-contained: the
 * exception list, the chat picker and its de-duplication all live here.
 */
export const NotificationsExceptions = ({ isDark = false }: NotificationsExceptionsProps) => {
  const { t } = useI18n();
  const [exceptionPickerOpen, setExceptionPickerOpen] = useState(false);
  const [exceptions, setExceptions] = useState<NotifyException[]>([
    { id: 1, name: 'Work Group', muted: false },
    { id: 2, name: 'Mom', muted: true },
  ]);

  const toggleException = (id: string | number) => {
    setExceptions(prev => prev.map(e => (e.id === id ? { ...e, muted: !e.muted } : e)));
    toast(t('settings.saved', 'Saved'), 'success');
  };

  const pickExceptionChat = (chat: { id: string | number; name?: string; title?: string }) => {
    setExceptionPickerOpen(false);
    if (exceptions.some(e => e.id === chat.id)) {
      toast(t('settings.addedException', 'Already in exceptions'), 'info');
      return;
    }
    setExceptions(prev => [...prev, { id: chat.id, name: chat.name || chat.title || `Chat ${chat.id}`, muted: false }]);
    toast(t('settings.added', 'Added'), 'success');
  };

  const stateLabel = (muted: boolean) =>
    muted ? t('settings.muted', 'Muted') : t('settings.allowed', 'Allowed');

  return (
    <>
      <SettingsSectionTitle title={t('settings.exceptions', 'Exceptions')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {exceptions.length === 0 && (
          <div className={`px-4 py-6 text-center text-sm ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{t('settings.noExceptions', 'No exceptions yet')}</div>
        )}
        {exceptions.map((e, i) => (
          <div key={e.id}>
            {i > 0 && <div className={`border-t ${"border-[var(--border-color)]"}`} />}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-gray-500/10" : "bg-black/5"}`}>
                  <Bell size={16} className={isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"} />
                </div>
                <span className={`text-sm truncate text-[var(--text-primary)]`}>{e.name}</span>
              </div>
              <button
                onClick={() => toggleException(e.id)}
                aria-label={stateLabel(e.muted)}
                title={stateLabel(e.muted)}
                className={`w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-lg transition-colors ${e.muted ? (isDark ? "bg-gray-600/30 text-gray-300" : "bg-slate-200 text-slate-600") : "bg-[var(--accent)] text-[var(--button-primary-text)]"}`}
              >
                {e.muted ? <BellOff size={16} /> : <Bell size={16} />}
                <span className="sr-only">{stateLabel(e.muted)}</span>
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => setExceptionPickerOpen(true)}
          aria-label={t('settings.addException', 'Add exception')}
          className={`w-full min-h-11 flex items-center justify-center gap-2 mt-2 rounded-lg text-sm font-medium text-[var(--accent)] transition-colors active:scale-[0.99] border border-dashed ${isDark ? "hover:bg-white/5 border-white/15" : "hover:bg-black/5 border-black/15"}`}
        >
          <Plus size={16} />
          <span>{t('settings.addException', 'Add exception')}</span>
        </button>
      </SettingsGroup>
      <ChatPickerModal
        open={exceptionPickerOpen}
        onClose={() => setExceptionPickerOpen(false)}
        onPick={pickExceptionChat}
        title={t('settings.pickExceptionChat', 'Add exception')}
      />
    </>
  );
};
