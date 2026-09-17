import { useState } from 'react';
import { Globe, Copy, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { toast } from 'sonner';

const ACCENT_PRESETS = ['#6C5CE7', '#2563EB', '#16A34A', '#EA580C', '#DC2626', '#0F172A'];

type SiteChatManagerProps = {
  isDark?: boolean;
};

export const SiteChatManager = ({ isDark = false }: SiteChatManagerProps) => {
  const { t } = useI18n();
  const siteChats = useAppStore((s) => s.siteChats);
  const websiteContacts = useAppStore((s) => s.websiteContacts);
  const createSiteChat = useAppStore((s) => s.createSiteChat);
  const updateSiteChatConfig = useAppStore((s) => s.updateSiteChatConfig);
  const removeWebsiteContact = useAppStore((s) => s.removeWebsiteContact);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    setBusy(true);
    try {
      const res = await createSiteChat(n);
      if (res) toast.success(t('company.siteChatCreated', 'Site chat created — copy the embed snippet'));
      else toast.error(t('company.createCompanyFirst', 'Create a company first'));
      setName('');
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success(t('common.copied', 'Copied')))
      .catch(() => {});
  };

  const saveConfig = (id: string, patch: Parameters<typeof updateSiteChatConfig>[1]) => {
    void updateSiteChatConfig(id, patch).then((res) => {
      if (res) toast.success(t('company.siteChatSaved', 'Widget settings saved — refresh the embedded page to apply'));
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('company.siteChatName', 'Site chat name (e.g. Sales)')}
          className="flex-1 min-h-11 rounded-xl px-3 bg-[var(--input-bg)] text-[var(--text-primary)] outline-none"
        />
        <button
          onClick={() => void create()}
          disabled={busy}
          className="min-h-11 px-4 rounded-xl flex items-center gap-2 bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} /> {t('company.create', 'Create')}
        </button>
      </div>

      {siteChats.length === 0 ? (
        <div className="text-sm text-[var(--text-secondary)] py-6 text-center">
          {t('company.noSiteChats', 'No embedded chats yet. Create one and paste the snippet into any website.')}
        </div>
      ) : (
        siteChats.map((sc) => {
          const chatContacts = websiteContacts
            .filter((c) => c.siteChatId === sc.id)
            .sort((a, b) => b.ts - a.ts);
          return (
            <div key={sc.id} className="rounded-2xl border border-[var(--border-color)] p-3 flex flex-col gap-3">
              <div className="font-bold text-sm flex items-center gap-2">
                <Globe size={16} /> {sc.name}
                <span className="ml-auto text-[11px] text-emerald-500">{t('company.siteChatLive', 'Website embed · E2E encrypted')}</span>
              </div>

              {/* Widget config */}
              <div className="flex flex-col gap-2 rounded-xl bg-[var(--bg-secondary)]/60 p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold">{t('company.accent', 'Widget color')}</span>
                  {ACCENT_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => saveConfig(sc.id, { accent: c })}
                      aria-label={c}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${sc.config.accent === c ? 'ring-2 ring-[var(--accent)] scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold">{t('company.widgetPosition', 'Widget position')}</span>
                  {(['bottom-right', 'bottom-left'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => saveConfig(sc.id, { position: p })}
                      aria-pressed={sc.config.position === p}
                      className={`min-h-9 px-3 rounded-lg text-xs cursor-pointer ${
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
                      onChange={(e) => saveConfig(sc.id, { collectContact: e.target.checked })}
                      className="accent-[var(--accent)]"
                    />
                    {t('company.collectContact', 'Ask visitors for contact details')}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold whitespace-nowrap">{t('company.greeting', 'Greeting message')}</span>
                  <input
                    value={sc.config.greeting}
                    onChange={(e) => saveConfig(sc.id, { greeting: e.target.value })}
                    placeholder={t('company.greeting', 'Greeting message')}
                    className="flex-1 min-h-10 rounded-lg px-3 bg-[var(--input-bg)] text-[var(--text-primary)] text-sm outline-none"
                  />
                </div>
                <div className="text-[10px] opacity-60">{t('company.widgetHint', 'Change settings → the embed snippet updates. Re-paste it into your site.')}</div>
              </div>

              <textarea
                readOnly
                value={sc.snippet}
                className="w-full h-20 rounded-xl p-2 text-xs bg-[var(--input-bg)] text-[var(--text-primary)] outline-none font-mono"
              />
              <button
                onClick={() => copy(sc.snippet)}
                className="self-end min-h-11 px-3 rounded-xl flex items-center gap-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] cursor-pointer"
              >
                <Copy size={14} /> {t('common.copy', 'Copy snippet')}
              </button>

              {/* Website contacts */}
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold flex items-center gap-2">
                  {t('company.websiteContacts', 'Website contacts')}
                  <span className="text-[10px] opacity-60">
                    {t('company.websiteContactCount', '{{n}} contact(s) from this site').replace('{{n}}', String(chatContacts.length))}
                  </span>
                </div>
                {chatContacts.length === 0 ? (
                  <div className="text-[11px] text-[var(--text-secondary)]">{t('company.noWebsiteContacts', 'No contacts yet — visitors who fill the widget form appear here and in CRM as website-sourced leads.')}</div>
                ) : (
                  chatContacts.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs bg-[var(--bg-secondary)]/60 rounded-lg px-2 py-1.5">
                      <span className="font-bold">{c.name}</span>
                      {c.email && <span className="opacity-60">· {c.email}</span>}
                      {c.phone && <span className="opacity-60">· {c.phone}</span>}
                      <span className="ml-auto text-[10px] opacity-50">{new Date(c.ts).toLocaleDateString()}</span>
                      <button
                        onClick={() => removeWebsiteContact(c.id)}
                        aria-label={t('company.removeWebsiteContact', 'Remove contact')}
                        className="min-w-8 min-h-8 flex items-center justify-center rounded-lg text-[var(--danger)] cursor-pointer hover:bg-[var(--danger)]/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};