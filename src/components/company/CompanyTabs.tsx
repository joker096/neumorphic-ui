import type { ElementType } from 'react';
import { Users, Building2, Contact, MessageSquare, Globe } from 'lucide-react';
import type { CompanyTab, TFunction } from './useCompanyContacts';

type CompanyTabsProps = {
  activeTab: CompanyTab;
  onSelect: (tab: CompanyTab) => void;
  t: TFunction;
};

const TABS: { key: CompanyTab; Icon: ElementType; labelKey: string; fallback: string }[] = [
  { key: 'members', Icon: Users, labelKey: 'company.tabs.members', fallback: 'Members' },
  { key: 'departments', Icon: Building2, labelKey: 'company.tabs.departments', fallback: 'Departments' },
  { key: 'contacts', Icon: Contact, labelKey: 'company.tabs.contacts', fallback: 'Contacts' },
  { key: 'inbox', Icon: MessageSquare, labelKey: 'company.tabs.inbox', fallback: 'Team Inbox' },
  { key: 'sitechat', Icon: Globe, labelKey: 'company.tabs.sitechat', fallback: 'Site Chats' },
];

export const CompanyTabs = ({ activeTab, onSelect, t }: CompanyTabsProps) => (
  <div className="flex items-center gap-1 p-1 mb-4 rounded-2xl bg-[var(--bg-tertiary)]">
    {TABS.map(({ key, Icon, labelKey, fallback }) => (
      <button
        key={key}
        onClick={() => onSelect(key)}
        className={`flex-1 min-h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold cursor-pointer transition-all ${
          activeTab === key
            ? 'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]'
            : 'text-[var(--text-secondary)] hover:brightness-110'
        }`}
      >
        <Icon size={16} />
        {t(labelKey, fallback)}
      </button>
    ))}
  </div>
);
