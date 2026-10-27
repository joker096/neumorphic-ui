/**
 * Personal (company-independent) website-chat manager.
 *
 * Lets the user create as many embed widgets as they need — one per site —
 * each with its own token, config and snippet, and shows the visitors each
 * widget has captured (contacts + conversation) live over the relay. It does
 * NOT depend on the company model at all.
 */

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { usePersonalSiteChatStore, type PersonalSiteChatConfig } from '../../store/personalSiteChat';
import { useI18n } from '../../lib/i18n';
import { toast } from 'sonner';
import { COMPANY_INPUT_CLASS } from './companyClasses';
import { SiteChatCard } from './SiteChatCard';

export const PersonalSiteChatManager = ({ isDark = false, onOpenPremium }: { isDark?: boolean; onOpenPremium?: () => void }) => {
  const { t } = useI18n();
  const hydrate = usePersonalSiteChatStore((s) => s.hydrate);
  const siteChats = usePersonalSiteChatStore((s) => s.siteChats);
  const websiteContacts = usePersonalSiteChatStore((s) => s.websiteContacts);
  const messages = usePersonalSiteChatStore((s) => s.messages);
  const createSiteChat = usePersonalSiteChatStore((s) => s.createSiteChat);
  const updateConfig = usePersonalSiteChatStore((s) => s.updateConfig);
  const removeSiteChat = usePersonalSiteChatStore((s) => s.removeSiteChat);
  const removeContact = usePersonalSiteChatStore((s) => s.removeContact);
  const setCannedReplies = usePersonalSiteChatStore((s) => s.setCannedReplies);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const create = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      const res = await createSiteChat(n);
      if (res) toast.success(t('company.siteChatCreated', 'Site chat created — copy the embed snippet'));
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

  const saveConfig = (id: string, patch: Partial<PersonalSiteChatConfig>) => {
    void updateConfig(id, patch).then((ok) => {
      if (ok) toast.success(t('company.siteChatSaved', 'Widget settings saved — refresh the embedded page to apply'));
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {!isDark && <div className="hidden" />}
      <div className="flex items-center gap-2">
        <input
          aria-label={t('company.siteChatName', 'Site chat name (e.g. Sales)')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void create();
          }}
          placeholder={t('company.siteChatName', 'Site chat name (e.g. Sales)')}
          className={COMPANY_INPUT_CLASS}
        />
        <button
          onClick={() => void create()}
          disabled={busy || !name.trim()}
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
          <SiteChatCard
            key={sc.id}
            sc={sc}
            contacts={websiteContacts
              .filter((c) => c.siteChatId === sc.id)
              .sort((a, b) => b.ts - a.ts)}
            thread={messages[sc.id] ?? []}
            onConfig={(patch) => saveConfig(sc.id, patch)}
            onCopy={copy}
            onRemoveContact={removeContact}
            onRemoveChat={() => removeSiteChat(sc.id)}
            setCannedReplies={(replies) => setCannedReplies(sc.id, replies)}
            onOpenPremium={onOpenPremium}
          />
        ))
      )}
    </div>
  );
};
