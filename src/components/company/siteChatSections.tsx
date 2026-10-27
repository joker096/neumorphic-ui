/**
 * Presentational building blocks of a site-chat card. Kept separate from
 * `SiteChatCard` so every file stays under the 300-line audit budget.
 */

import { useState, type CSSProperties } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import type { PersonalSiteChatConfig } from '../../store/personalSiteChat';
import { useI18n } from '../../lib/i18n';
import { formatDate } from '../../utils/dateTime';
import { formatClockTime } from '../../utils/chatUtils';
import { SECONDARY_CAPTION_CLASS } from '../ui/textClasses';

type T = (k: string, fb?: string) => string;

/** Static thumbnail of the widget, reusing the self-contained `.ew-*` styles. */
export function WidgetPreview({ name, config, t }: { name: string; config: PersonalSiteChatConfig; t: T }) {
  return (
    <div data-ew-theme="light" className="ew-root ew-bot-right" style={{ position: 'static', pointerEvents: 'none' } as CSSProperties}>
      <div className="ew-panel">
        <div className="ew-header" style={{ backgroundColor: config.accent, color: '#ffffff' }}>
          <div className="ew-header-left">
            <div className="ew-header-avatar">{(config.title || name).charAt(0).toUpperCase()}</div>
            <span className="ew-header-title">{config.title || name}</span>
            <div className="ew-online-dot" />
          </div>
          <span className="ew-close" aria-hidden="true"><X size={18} /></span>
        </div>
        <div className="ew-messages">
          {config.greeting && (
            <div className="ew-msg-row ew-msg-other"><div className="ew-msg">{config.greeting}</div></div>
          )}
        </div>
        <div className="ew-composer">
          <input className="ew-input" placeholder={t('chat.typeMessage', 'Type a message…')} aria-label={t('chat.typeMessage', 'Type a message…')} readOnly tabIndex={-1} />
          <span className="ew-send" style={{ backgroundColor: config.accent }} aria-hidden="true"><Send size={16} /></span>
        </div>
        {!config.hideBrand && <div className="ew-footer">Powered by <b>Mess&Anger</b></div>}
      </div>
    </div>
  );
}

export type ThreadMessage = { id: string; text: string; from: 'visitor' | 'me'; ts: number };

/** Live conversation thread with a composer to reply to the visitor. */
export function ConversationSection({
  thread,
  onSend,
}: {
  thread: ThreadMessage[];
  onSend: (text: string) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <details className="rounded-xl bg-[var(--bg-secondary)]/60 p-3 text-xs">
      <summary className="font-bold text-[var(--text-primary)] cursor-pointer">
        {t('company.siteConversations', 'Conversation')}
      </summary>
      {thread.length === 0 ? (
        <div className={SECONDARY_CAPTION_CLASS}>{t('company.siteConversationEmpty', 'No messages yet — visitors appear here in real time.')}</div>
      ) : (
        <div className="mt-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
          {thread.map((m) => (
            <div key={m.id} className={`flex flex-col gap-0.5 rounded-lg px-2 py-1.5 ${m.from === 'visitor' ? 'bg-[var(--bg-tertiary)]' : 'bg-emerald-500/10'}`}>
              <span className="text-[var(--text-primary)] break-words">{m.text}</span>
              <span className={SECONDARY_CAPTION_CLASS}>{formatClockTime(m.ts)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={t('company.replyPlaceholder', 'Type a reply…')}
          aria-label={t('company.replyPlaceholder', 'Type a reply…')}
          className="flex-1 min-h-11 rounded-lg px-3 bg-[var(--input-bg)] text-[var(--text-primary)] text-xs outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          aria-label={t('company.sendReply', 'Send reply')}
          className="min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] disabled:opacity-40 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>
    </details>
  );
}

export type WebsiteContact = { id: string; name?: string; email?: string; phone?: string; ts: number };

/** Up to five latest website contacts captured by the widget. */
export function WebsiteContactsSection({
  contacts,
  onRemove,
}: {
  contacts: WebsiteContact[];
  onRemove: (id: string) => void;
}) {
  const { t, lang } = useI18n();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-bold flex items-center gap-2">
        {t('company.websiteContacts', 'Website contacts')}
        <span className={SECONDARY_CAPTION_CLASS}>
          {t('company.websiteContactCount', '{{n}} contact(s) from this site').replace('{{n}}', String(contacts.length))}
        </span>
      </div>
      {contacts.length === 0 ? (
        <div className={SECONDARY_CAPTION_CLASS}>{t('company.noWebsiteContacts', 'No contacts yet — visitors who fill the widget form appear here.')}</div>
      ) : (
        contacts.slice(0, 5).map((c) => (
          <div key={c.id} className="flex items-center gap-2 text-xs bg-[var(--bg-secondary)]/60 rounded-lg px-2 py-1.5">
            <span className="font-bold">{c.name}</span>
            {c.email && <span className="opacity-60">· {c.email}</span>}
            {c.phone && <span className="opacity-60">· {c.phone}</span>}
            <span className="ml-auto text-xs text-[var(--text-secondary)]">{formatDate(c.ts, lang)}</span>
            <button
              onClick={() => onRemove(c.id)}
              aria-label={t('company.removeWebsiteContact', 'Remove contact')}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-[var(--danger)] cursor-pointer hover:bg-[var(--danger)]/10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
