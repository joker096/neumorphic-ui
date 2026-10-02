import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { ContactProfileModal } from './ContactProfileModal';
import { useDebounce } from '../hooks/useDebounce';
import { useAppStore } from '../store';
import type { ContactTag } from '../types/contact';
import { ContactCreateEditModal } from './ContactCreateEditModal';
import { ContactItem } from './contacts/ContactItem';
import { ContactAddForm } from './contacts/ContactAddForm';
import { ContactsToolbar } from './contacts/ContactsToolbar';
import { ContactsTabs, type TabOption } from './contacts/ContactsTabs';
import { ContactsScanModal } from './contacts/ContactsScanModal';
import { ContactsShareModal } from './contacts/ContactsShareModal';
import type { Contact, ContactField } from '../types/contact';
import type { IScannerError } from '@yudiel/react-qr-scanner';
import { InviteQRModal } from './ui/InviteQRModal';
import { DataState } from './ui/DataState';
import { PROFILE_FALLBACK_ID } from '../constants/settingsConstants';
import { pickContactGradient } from '../constants/contactConstants';



export const ContactsView = ({ theme, contacts, setContacts, onCall, onVideoCall, onMessage, onEdit }: {
  theme: 'light' | 'dark', 
  contacts: Contact[],
  setContacts: (updater: Contact[] | ((prev: Contact[]) => Contact[])) => void,
  onCall?: (name: string, color: string) => void, 
  onVideoCall?: (name: string, color: string) => void,
  onMessage?: (name: string, color: string) => void,
  onEdit?: () => void
}) => {
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const userProfile = useAppStore((s) => s.userProfile);
  const shareId = userProfile?.id ? `nexus://id/${userProfile.id}` : PROFILE_FALLBACK_ID;
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    import('qrcode')
      .then((qr) => qr.toDataURL(shareId, { margin: 1, width: 256, color: { dark: '#0f172a', light: '#ffffff' } }))
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [shareId]);
  const [isScanning, setIsScanning] = useState(false);
  const [sortBy, setSortBy] = useState<'alpha' | 'recent'>('alpha');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showShareId, setShowShareId] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContactName, setNewContactName] = useState("");
  const [newContactId, setNewContactId] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabOption>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [scanError, setScanError] = useState<IScannerError | null>(null);
  const [scannerKey, setScannerKey] = useState(0);

  const openScan = () => {
    setScanError(null);
    setScannerKey((k) => k + 1);
    setIsScanning(true);
    setShowAddForm(false);
    setShowShareId(false);
  };

  const retryScan = () => {
    setScanError(null);
    setScannerKey((k) => k + 1);
  };

  const toggleFavorite = (id: string, isFavorite: boolean) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, isFavorite } : c));
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactName.trim() && newContactId.trim()) {
      const color = pickContactGradient(contacts.length);
      setContacts([{ name: newContactName.trim(), id: newContactId.trim(), color, lastSeen: Date.now() }, ...contacts]);
      setNewContactName(""); setNewContactId(""); setShowAddForm(false);
    }
  };

  const handleSaveContact = (name: string, id: string, color?: string, localFields?: ContactField[], extra?: { company?: string; position?: string; tags?: ContactTag[]; notes?: string }) => {
    if (editingContact) {
      setContacts(contacts.map(c => c.id === editingContact.id ? { ...c, name, id, color: color || c.color, localFields, ...extra } : c));
    } else {
      const newColor = pickContactGradient(contacts.length);
      setContacts([{ name, id, color: newColor, lastSeen: Date.now(), localFields, ...extra }, ...contacts]);
    }
    setShowAddForm(false); setShowEditForm(false); setEditingContact(null);
  };

  const copyId = () => {
    navigator.clipboard.writeText(shareId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredContacts = useMemo(() => contacts.filter(c => {
    const matchesSearch = !debouncedSearch || c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.id.toLowerCase().includes(debouncedSearch.toLowerCase());
    if (!matchesSearch) return false;
      switch (activeTab) {
        case 'favorites': return c.isFavorite;
        case 'recent': return c.lastSeen > 0;
        case 'blocked': return c.isBlocked;
        default: return true;
      }
  }), [contacts, debouncedSearch, activeTab]);

  const sortedContacts = useMemo(() => [...filteredContacts].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1;
    if (sortBy === 'alpha') return a.name.localeCompare(b.name);
    return b.lastSeen - a.lastSeen;
  }), [filteredContacts, sortBy]);


  return (
    <div data-testid="contacts-container" className={`w-full flex-1 flex flex-col overflow-y-auto px-3 md:px-5 py-3 md:py-5 ${isDark ? "bg-[var(--bg-primary)]/50" : "bg-[var(--bg-secondary)]/50"}`}>
      
      <ContactsToolbar
        isDark={isDark}
        t={t}
        onScan={openScan}
        onShare={() => { setShowShareId(true); setIsScanning(false); setShowAddForm(false); }}
        onAdd={() => { setShowAddForm(true); setIsScanning(false); setShowShareId(false); }}
        onInvite={() => { setShowInvite(true); setIsScanning(false); setShowShareId(false); setShowAddForm(false); }}
      />

      <ContactsTabs
        contacts={contacts}
        filteredCount={filteredContacts.length}
        searchQuery={searchQuery}
        activeTab={activeTab}
        isDark={isDark}
        t={t}
        onSearchChange={setSearchQuery}
        onTabChange={setActiveTab}
      />

      <div className="w-full flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {sortedContacts.length === 0 && !showAddForm && !isScanning && !showShareId ? (
            activeTab === 'blocked' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DataState
                  status="empty"
                  isDark={isDark}
                  title={t('contacts.noBlocked')}
                  description={t('contacts.noBlockedHint')}
                  action={{ label: t('contacts.viewAll'), onClick: () => setActiveTab('all') }}
                />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DataState
                  status="empty"
                  isDark={isDark}
                  title={t('contacts.noContacts')}
                  description={t('contacts.noContactsSubtitle')}
                  action={{ label: t('contacts.addContact'), onClick: () => setShowAddForm(true) }}
                />
              </motion.div>
            )
          ) : (
            <motion.div initial="hidden" animate="show" className="flex flex-col gap-2">
              {sortedContacts.map((c, i) => (
                <ContactItem key={c.id} contact={c} theme={theme} isDark={isDark}
                  onCall={onCall} onVideoCall={onVideoCall}
                  onToggleFavorite={toggleFavorite} onClick={() => setSelectedContact(c)} t={t} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ContactProfileModal contact={selectedContact} theme={theme}
        onClose={() => setSelectedContact(null)}
        onCall={() => { if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color); setSelectedContact(null); }}
        onVideoCall={() => { if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color); setSelectedContact(null); }}
        onMessage={() => { if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color); setSelectedContact(null); }}
        onDelete={() => { if (selectedContact) setContacts(contacts.filter(c => c.id !== selectedContact.id)); }}
        onBlock={() => { if (selectedContact) setContacts(contacts.map(c => c.id === selectedContact.id ? { ...c, isBlocked: true } : c)); setSelectedContact(null); }}
        onUnblock={() => { if (selectedContact) setContacts(contacts.map(c => c.id === selectedContact.id ? { ...c, isBlocked: false } : c)); setSelectedContact(null); }}
        onEdit={() => { if (selectedContact) { setEditingContact(selectedContact); setShowEditForm(true); } setSelectedContact(null); }}
        onToggleFavorite={(id, isFavorite) => {
          toggleFavorite(id, isFavorite);
          if (selectedContact?.id === id) {
            setSelectedContact({ ...selectedContact, isFavorite });
          }
        }}
      />

      <ContactAddForm
        isDark={isDark}
        theme={theme}
        show={showAddForm}
        name={newContactName}
        setName={setNewContactName}
        id={newContactId}
        setId={setNewContactId}
        onClose={() => { setShowAddForm(false); setNewContactName(''); setNewContactId(''); }}
        onSubmit={handleAddContact}
        onScan={openScan}
        t={t}
      />

      {showEditForm && editingContact && (
        <ContactCreateEditModal contact={editingContact} isDark={isDark}
          onClose={() => { setShowEditForm(false); setEditingContact(null); }}
          onSave={handleSaveContact} />
      )}

      <ContactsScanModal
        isScanning={isScanning}
        isDark={isDark}
        theme={theme}
        scanError={scanError}
        scannerKey={scannerKey}
        t={t}
        onClose={() => setIsScanning(false)}
        onRetry={retryScan}
        onError={setScanError}
        onScanned={(value) => { setIsScanning(false); setNewContactId(value); setShowAddForm(true); }}
      />

      <ContactsShareModal
        showShareId={showShareId}
        isDark={isDark}
        theme={theme}
        qrDataUrl={qrDataUrl}
        shareId={shareId}
        copied={copied}
        t={t}
        onClose={() => setShowShareId(false)}
        onCopy={copyId}
      />

      <InviteQRModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        inviteText={t('onboarding.inviteText')}
        isDark={isDark}
        t={t}
      />
    </div>
  );
};




