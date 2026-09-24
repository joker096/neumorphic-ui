import React from 'react';
import { Users, Briefcase, Inbox, Mail, Archive } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { CHAT_FOLDER_KEYS } from '../../constants/chatConstants';

interface NotificationsSectionProps {
  isDark?: boolean;
  onBack: () => void;
}

const FOLDER_META: Record<string, { icon: React.ReactNode; descKey: string; descFallback: string }> = {
  all: { icon: <Inbox size={16} />, descKey: 'settings.folderDesc.all', descFallback: 'All chats' },
  personal: { icon: <Users size={16} />, descKey: 'settings.folderDesc.personal', descFallback: 'Direct chats' },
  unread: { icon: <Mail size={16} />, descKey: 'settings.folderDesc.unread', descFallback: 'Chats with unread messages' },
  work: { icon: <Briefcase size={16} />, descKey: 'settings.folderDesc.work', descFallback: 'Groups' },
  groups: { icon: <Users size={16} />, descKey: 'settings.folderDesc.groups', descFallback: 'Groups' },
  archived: { icon: <Archive size={16} />, descKey: 'settings.folderDesc.archived', descFallback: 'Archived chats' },
};

export const FoldersSection = ({ isDark = false, onBack }: NotificationsSectionProps) => {
  const { t } = useI18n();

  return (
    <SubView title={t('settings.folders', 'Folders')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('settings.chatFilters', 'Chat filters')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        {CHAT_FOLDER_KEYS.map((key, i) => {
          const meta = FOLDER_META[key];
          return (
            <div key={key}>
              {i > 0 && <div className={`border-t ${"border-[var(--border-color)]"}`} />}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-[var(--accent-soft)]" : "bg-[var(--accent)]/10"} text-[var(--accent)]`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t(`chat.folders.${key}`)}</div>
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t(meta.descKey, meta.descFallback)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </SettingsGroup>
    </SubView>
  );
};