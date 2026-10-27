/**
 * Single site-chat card: config, quick replies, embed snippet, live
 * conversation and website contacts. Rendered inside `PersonalSiteChatManager`.
 */

import { useState } from 'react';
import { Globe, Copy, Crown, X, Trash2 } from 'lucide-react';
import { type PersonalSiteChat, type PersonalSiteChatConfig } from '../../store/personalSiteChat';
import { usePersonalSiteChatInbox } from '../../hooks/usePersonalSiteChatInbox';
import { useI18n } from '../../lib/i18n';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { ACCENT_PRESETS } from './companyClasses';
import { SECONDARY_CAPTION_CLASS } from '../ui/textClasses';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import type { RelayStatus } from '../../lib/company/relaySocket';
import { WidgetPreview, ConversationSection, WebsiteContactsSection } from './siteChatSections';

export type SiteChatCardProps = {
  sc: PersonalSiteChat;
  contacts: { id: string; name?: string; email?: string; phone?: string; ts: number }[];
  thread: { id: string; text: string; from: 'visitor' | 'me'; ts: number }[];
  onConfig: (patch: Partial<PersonalSiteChatConfig>) => void;
  onCopy: (text: string) => void;
  onRemoveContact: (id: string) => void;
  onRemoveChat: () => void;
  setCannedReplies: (replies: string[]) => void;
  onOpenPremium?: () => void;
};

function relayStatusLabel(status: RelayStatus, t: (k: string, fb?: string) => string): { label: string; cls: string } {
  if (status === 'online') return { label: t('company.relayOnline', 'Online'), cls: 'text-emerald-500' };
  if (status === 'offline') return { label: t('company.relayOffline', 'Offline'), cls: 'text-[var(--danger)]' };
  return { label: t('company.relayConnecting', 'Connecting…'), cls: 'text-amber-500' };
}

export function SiteChatCard({ sc, contacts, thread, onConfig, onCopy, onRemoveContact, onRemoveChat, setCannedReplies, onOpenPremium }: SiteChatCardProps) {
  const { t } = useI18n();
  const { status, reply } = usePersonalSiteChatInbox(sc.id);
  const st = relayStatusLabel(status, t);
  const premium = useAppStore((s) => s.premiumEntitlement.premium);
  const [replyDraft, setReplyDraft] = useState('');

  const sendReply = (text: string) => {
    void reply(text).then((ok) => {
      if (!ok) toast.error(t('company.replyFailed', "Couldn't send reply — visitor offline"));
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--border-color)] p-3 flex flex-col gap-3">
      <div className="font-bold text-sm flex items-center gap-2">
        <Globe size={16} /> {sc.name}
        <span className={`ml-auto text-xs ${st.cls}`}>{st.label}</span>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)]/60 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold">{t('company.accent', 'Widget color')}</span>
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onConfig({ accent: c })}
              aria-label={`${t('company.accent', 'Widget color')} ${c}`}
              className="flex items-center justify-center min-w-11 min-h-11 p-1 rounded-full cursor-pointer"
            >
              <span
                className={`w-6 h-6 rounded-full transition-transform ${sc.config.accent === c ? 'ring-2 ring-[var(--accent)] scale-110' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold">{t('company.widgetPosition', 'Widget position')}</span>
          {(['bottom-right', 'bottom-left'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onConfig({ position: p })}
              aria-pressed={sc.config.position === p}
              className={`min-w-11 min-h-11 px-3 rounded-lg text-xs cursor-pointer ${
                sc.config.position === p
                  ? 'bg-[var(--accent)] text-[var(--button-primary-text)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              {t(`company.${p === 'bottom-right' ? 'bottomRight' : 'bottomLeft'}`, p)}
            </button>
          ))}
          <label className="flex items-center gap-2 ml-auto text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={sc.config.collectContact}
              onChange={(e) => onConfig({ collectContact: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            {t('company.collectContact', 'Ask visitors for contact details')}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold whitespace-nowrap">{t('company.widgetName', 'Widget name')}</span>
          <input
            aria-label={t('company.widgetName', 'Widget name')}
            value={sc.config.title ?? sc.name}
            onChange={(e) => onConfig({ title: e.target.value })}
            placeholder={t('company.widgetName', 'Widget name')}
            className="flex-1 min-h-11 rounded-lg px-3 bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold whitespace-nowrap">{t('company.greeting', 'Greeting message')}</span>
          <input
            aria-label={t('company.greeting', 'Greeting message')}
            value={sc.config.greeting}
            onChange={(e) => onConfig({ greeting: e.target.value })}
            placeholder={t('company.greeting', 'Greeting message')}
            className="flex-1 min-h-11 rounded-lg px-3 bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none"
          />
        </div>
        <div className={SECONDARY_CAPTION_CLASS}>{t('company.widgetHint', 'Change settings → the embed snippet updates. Re-paste it into your site.')}</div>
      </div>

      {premium ? (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)]/60 p-3">
          <span className="text-xs font-bold flex-1">{t('company.removeBranding', 'Remove Mess&Anger branding')}</span>
          <ToggleSwitch
            isOn={Boolean(sc.config.hideBrand)}
            onToggle={() => onConfig({ hideBrand: !sc.config.hideBrand })}
            title={t('company.removeBranding', 'Remove Mess&Anger branding')}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
          <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-amber-500/15 text-amber-500">
            <Crown size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[var(--text-primary)]">{t('company.removeBranding', 'Remove Mess&Anger branding')}</div>
            <div className="text-xs mt-0.5 text-[var(--text-tertiary)] dark:text-[var(--text-secondary)]">
              {t('company.removeBrandingSub', 'A clean, unbranded widget with Premium')}
            </div>
          </div>
          {onOpenPremium && (
            <button
              type="button"
              aria-label={t('premium.crmUnlock', 'Open Premium')}
              onClick={onOpenPremium}
              className="min-h-11 px-3 rounded-lg text-sm font-bold transition-colors bg-amber-500 text-[var(--ink-on-saturate)] hover:brightness-110"
            >
              {t('premium.crmUnlock', 'Open Premium')}
            </button>
          )}
        </div>
      )}

      <details className="rounded-xl bg-[var(--bg-secondary)]/60 p-3 text-xs">
        <summary className="font-bold text-[var(--text-primary)] cursor-pointer">{t('company.quickReplies', 'Quick replies')}</summary>
        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
          {(sc.cannedReplies ?? []).map((r, i) => (
            <span key={i} className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-full pl-3 pr-1 py-1 text-xs">
              <button type="button" onClick={() => sendReply(r)} className="cursor-pointer text-[var(--text-primary)]">
                {r}
              </button>
              <button
                type="button"
                onClick={() => setCannedReplies(sc.cannedReplies?.filter((_, j) => j !== i) ?? [])}
                aria-label={t('common.remove', 'Remove')}
                className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-[var(--danger)] cursor-pointer hover:bg-[var(--danger)]/10"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && replyDraft.trim()) {
                setCannedReplies([...(sc.cannedReplies ?? []), replyDraft.trim()]);
                setReplyDraft('');
              }
            }}
            placeholder={t('company.addQuickReply', 'Add quick reply…')}
            aria-label={t('company.addQuickReply', 'Add quick reply…')}
            className="min-w-40 flex-1 min-h-9 rounded-full px-3 bg-[var(--input-bg)] text-[var(--text-primary)] text-xs outline-none"
          />
        </div>
      </details>

      <details className="rounded-xl bg-[var(--bg-secondary)]/60 p-3 text-xs">
        <summary className="font-bold text-[var(--text-primary)] cursor-pointer">{t('company.widgetPreview', 'Preview widget')}</summary>
        <div className="mt-3 flex justify-center overflow-x-auto">
          <WidgetPreview name={sc.name} config={sc.config} t={t} />
        </div>
      </details>

      <details className="rounded-xl bg-[var(--bg-secondary)]/60 p-3 text-xs text-[var(--text-secondary)]">
        <summary className="font-bold text-[var(--text-primary)] cursor-pointer">{t('company.embedHowTo', 'How to embed on your site')}</summary>
        <ol className="mt-2 flex flex-col gap-1 list-decimal list-inside">
          <li>{t('company.embedStep1', 'Copy the snippet below.')}</li>
          <li>{t('company.embedStep2', 'Paste it before the closing </body> tag of any page on your website.')}</li>
          <li>{t('company.embedStep3', 'Visitor chats and contacts arrive here.')}</li>
        </ol>
      </details>

      <textarea
        aria-label={t('company.embedSnippet', 'Embed snippet')}
        readOnly
        value={sc.snippet}
        className="w-full h-20 rounded-xl p-2 text-xs bg-[var(--input-bg)] text-[var(--text-primary)] outline-none font-mono"
      />
      <button
        onClick={() => onCopy(sc.snippet)}
        className="self-end min-h-11 px-3 rounded-xl flex items-center gap-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] cursor-pointer"
      >
        <Copy size={14} /> {t('common.copy', 'Copy snippet')}
      </button>

      <ConversationSection thread={thread} onSend={sendReply} />

      <WebsiteContactsSection contacts={contacts} onRemove={onRemoveContact} />

      <button
        onClick={onRemoveChat}
        className="self-end min-h-11 px-3 rounded-xl flex items-center gap-2 text-[var(--danger)] bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-xs font-bold cursor-pointer"
      >
        <Trash2 size={14} /> {t('company.removeSiteChat', 'Delete this site chat')}
      </button>
    </div>
  );
}
