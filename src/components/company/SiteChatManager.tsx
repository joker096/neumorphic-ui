import { useState } from 'react';
import { Globe, Copy, Plus } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { toast } from 'sonner';

type SiteChatManagerProps = {
  isDark?: boolean;
};

export const SiteChatManager = ({ isDark = false }: SiteChatManagerProps) => {
  const { t } = useI18n();
  const siteChats = useAppStore((s) => s.siteChats);
  const createSiteChat = useAppStore((s) => s.createSiteChat);
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
    navigator.clipboard?.writeText(text).then(() => toast.success(t('common.copied', 'Copied'))).catch(() => {});
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
        siteChats.map((sc) => (
          <div key={sc.id} className="rounded-2xl border border-[var(--border-color)] p-3 flex flex-col gap-2">
            <div className="font-bold text-sm flex items-center gap-2">
              <Globe size={16} /> {sc.name}
            </div>
            <div className="text-[11px] text-emerald-500">{t('company.e2eAnonymous')}</div>
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
          </div>
        ))
      )}
    </div>
  );
};
