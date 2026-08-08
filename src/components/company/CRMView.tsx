import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../store';
import type { Contact, ContactTag } from '../../types/contact';
import { ContactProfileModal } from '../ContactProfileModal';

type CRMViewProps = {
  onClose?: () => void;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  contacts: Contact[];
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void;
  setChats: (updater: any[] | ((prev: any[]) => any[])) => void;
};

export const CRMView: React.FC<CRMViewProps> = ({ onClose, onMessage, onCall, onVideoCall, contacts, setContacts, setChats }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'all' | 'company' | 'tag'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const theme = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const companyContacts = contacts.filter(c => c.company);
  const noCompanyContacts = contacts.filter(c => !c.company);

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];
  const companyNames = [...new Set(contacts.map(c => c.company).filter(Boolean))];

  const filteredContacts = searchQuery
    ? contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.company || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : contacts;

  const groupedByCompany = companyContacts.reduce((acc, contact) => {
    const company = contact.company || t('company.noCompany', 'No Company');
    if (!acc[company]) acc[company] = [];
    acc[company].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const getTagColor = (tag: string) => {
    switch (tag as ContactTag) {
      case 'client': return 'text-[#22c372] bg-[#22c372]/10';
      case 'lead': return 'text-[#3b82ff] bg-[#3b82ff]/10';
      case 'partner': return 'text-[#8b5cff] bg-[#8b5cff]/10';
      case 'vendor': return 'text-[var(--accent)] bg-[var(--accent)]/10';
      case 'vip': return 'text-[#f59f19] bg-[#f59f19]/10';
      default: return 'text-[var(--text-secondary)] bg-[var(--bg-secondary)]';
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-md mb-3 bg-black/5 sm:mb-4">
        {(['all', 'company', 'tag'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedTag(null); }}
            className={`flex-1 py-2 text-[9px] sm:text-[10px] font-bold rounded-lg uppercase tracking-wide ${activeTab === tab ? "bg-[var(--button-primary-bg)] text-[var(--button-primary-text)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          >
            {tab === 'all' ? t('crm.all') : tab === 'company' ? t('crm.byCompany') : t('crm.byTag')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="w-full h-10 rounded-full px-3 flex items-center gap-2 mb-3 sm:mb-4 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M18 18l3 3" /></svg>
        <input
          type="text"
          placeholder={t('crm.searchContacts') || 'Search contacts...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      {/* Company View */}
      {activeTab === 'company' && Object.entries(groupedByCompany).map(([company, companyContacts]) => (
        <div key={company} className="mb-4">
          <div className="text-xs font-bold uppercase tracking-widest mb-2 text-[var(--accent)]">
            {company} ({companyContacts.length})
          </div>
          {companyContacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="mb-2 p-3 rounded-md flex items-center gap-3 neu-card-inset transition-colors cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-primary)] text-[10px] font-bold ${contact.color || "bg-[var(--accent)]"}`}>{(contact.name || 'U').charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-[var(--text-primary)]">{contact.name}</div>
                <div className="text-[10px] truncate text-[var(--text-secondary)]">{contact.position || contact.email || contact.company}</div>
              </div>
              {contact.isFavorite && <span className="text-[10px] text-[var(--color-warning)]">★</span>}
            </div>
          ))}
        </div>
      ))}

      {/* Tag View */}
      {activeTab === 'tag' && allTags.map(tag => (
        <div key={tag}>
          <button
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className="w-full text-left mb-2 p-3 rounded-md flex items-center justify-between neu-card-inset transition-colors"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">{tag}</span>
            <span className={`text-[9px] sm:text-[10px] px-2 py-1 rounded-full ${getTagColor(tag)}`}>
              {contacts.filter(c => c.tags?.includes(tag as ContactTag)).length}
            </span>
          </button>
          {selectedTag === tag && contacts.filter(c => c.tags?.includes(tag as ContactTag)).map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="ml-4 mb-2 p-2 rounded-md flex items-center gap-2 bg-black/5 cursor-pointer"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-primary)] text-[8px] font-bold ${contact.color || "bg-[var(--accent)]"}`}>{(contact.name || 'U').charAt(0)}</div>
              <div className="text-xs text-[var(--text-primary)]">{contact.name}</div>
            </div>
          ))}
        </div>
      ))}

      {/* All View */}
      {(activeTab === 'all' || !searchQuery) && (
        <div className="space-y-2">
          {filteredContacts.filter(c => !c.company).map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="p-3 rounded-md flex items-center gap-3 cursor-pointer neu-card-inset"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-primary)] text-[10px] font-bold ${contact.color || "bg-[var(--accent)]"}`}>{(contact.name || 'U').charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)]">{contact.name}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">{contact.email || contact.telegram || t('contacts.noDetails', 'No details')}</div>
              </div>
              {contact.isFavorite && <span className="text-[10px] text-[var(--color-warning)]">★</span>}
            </div>
          ))}
          {filteredContacts.filter(c => c.company).map(contact => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className="p-3 rounded-md flex items-center gap-3 cursor-pointer neu-card-inset"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-primary)] text-[10px] font-bold ${contact.color || "bg-[var(--accent)]"}`}>{(contact.name || 'U').charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)]">{contact.name}</div>
                <div className="text-[10px] text-[var(--text-secondary)]">{contact.company}{contact.position ? ` · ${contact.position}` : ''}</div>
              </div>
              {contact.isFavorite && <span className="text-[10px] text-[var(--color-warning)]">★</span>}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredContacts.length === 0 && (
        <div className="text-center py-8 text-[var(--text-tertiary)]">
          <p className="text-sm">{t('crm.noContactsFound', 'No contacts found')}</p>
          <p className="text-[10px] mt-1">{t('crm.addContactsHint', 'Add contacts to start managing CRM')}</p>
        </div>
      )}

      <ContactProfileModal
        contact={selectedContact}
        theme={theme}
        onClose={() => setSelectedContact(null)}
        onMessage={onMessage}
        onCall={onCall}
        onVideoCall={onVideoCall}
      />
    </div>
  );
};



