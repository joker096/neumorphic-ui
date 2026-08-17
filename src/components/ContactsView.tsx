import React, { useState, useMemo, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { QrCode, Scan, Users, UserPlus, X, Clock, Check, Copy, Share, Phone, MessageSquare, Trash2, Edit, Loader2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import QRCode from 'qrcode';
import { ContactProfileModal } from './ContactProfileModal';
import { useDebounce } from '../hooks/useDebounce';
import { useAppStore } from '../store';
import type { ContactTag } from '../types/contact';
import { ContactCreateEditModal } from './ContactCreateEditModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { ContactItem } from './contacts/ContactItem';
import { ContactAddForm } from './contacts/ContactAddForm';
import type { Contact, ContactField } from '../types/contact';
import { FormModal } from './ui/FormModal';
import { FormField } from './ui/FormField';
import { FormActions } from './ui/FormActions';
import { SearchInput } from './ui/SearchInput';
import { DataState } from './ui/DataState';
import { PROFILE_FALLBACK_ID } from '../constants/settingsConstants';
import { pickContactGradient } from '../constants/contactConstants';

type TabOption = 'all' | 'favorites' | 'recent';

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
    QRCode.toDataURL(shareId, { margin: 1, width: 256, color: { dark: '#0f172a', light: '#ffffff' } })
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    });
  };

  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredContacts = useMemo(() => contacts.filter(c => {
    const matchesSearch = !debouncedSearch || c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.id.toLowerCase().includes(debouncedSearch.toLowerCase());
    if (!matchesSearch) return false;
      switch (activeTab) {
        case 'favorites': return c.isFavorite;
        case 'recent': return c.lastSeen > 0;
        default: return true;
      }
  }), [contacts, debouncedSearch, activeTab]);

  const sortedContacts = useMemo(() => [...filteredContacts].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1;
    if (sortBy === 'alpha') return a.name.localeCompare(b.name);
    return b.lastSeen - a.lastSeen;
  }), [filteredContacts, sortBy]);

  const tabs = useMemo(() => [
    { key: 'all' as TabOption, label: t('contacts.allTab', { count: contacts.length }), icon: <Users size={14} /> },
    { key: 'favorites' as TabOption, label: t('contacts.favoritesTab', { count: contacts.filter(c => c.isFavorite).length }), icon: <Star size={14} /> },
    { key: 'recent' as TabOption, label: t('contacts.recentTab'), icon: <Clock size={14} /> },
  ], [contacts, t]);

  return (
    <div data-testid="contacts-container" className={`w-full flex-1 flex flex-col overflow-y-auto px-3 md:px-5 py-3 md:py-5 ${isDark ? "bg-[var(--bg-primary)]/50" : "bg-[var(--bg-secondary)]/50"}`}>
      
      <div className="w-full flex items-center justify-between gap-2 mb-4 px-2">
        <h2 className={`font-sans text-lg sm:text-xl font-bold tracking-wide truncate min-w-0 ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
          {t('contacts.title')}
        </h2>
        <div className="flex gap-1.5 sm:gap-2 text-[var(--accent)] shrink-0">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setIsScanning(true); setShowAddForm(false); setShowShareId(false); }}
            title={t('contacts.scanContactQR')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-80 transition-all">
            <Scan size={22} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setShowShareId(true); setIsScanning(false); setShowAddForm(false); }}
            title={t('contacts.shareIdentity')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-80 transition-all">
            <QrCode size={22} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setShowAddForm(true); setIsScanning(false); setShowShareId(false); }}
            title={t('contacts.addContact')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-80 transition-all">
            <UserPlus size={22} />
          </motion.button>
        </div>
      </div>

      <div className="w-full mb-4">
        <div className="mb-3">
          <SearchInput value={searchQuery} onChange={setSearchQuery}
            placeholder={t('contacts.searchPlaceholder')} isDark={isDark} shape="pill" />
        </div>

        <div className={`flex rounded-full p-1 overflow-x-auto scrollbar-none ${isDark ? "bg-white/5" : "bg-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {tabs.map(tab => (
            <motion.button key={tab.key} whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 min-h-[var(--control-height-sm)] rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? (isDark ? 'bg-white/10 text-[var(--text-primary)] shadow-sm' : 'bg-white shadow-sm text-slate-800')
                  : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')
              }`}>
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        {searchQuery && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className={`text-xs mt-2 px-1 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
            {t('contacts.foundResults', { count: filteredContacts.length, total: contacts.length })}
          </motion.div>
        )}
      </div>

      <div className="w-full flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {sortedContacts.length === 0 && !showAddForm && !isScanning && !showShareId ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DataState
                status="empty"
                isDark={isDark}
                title={t('contacts.noContacts')}
                description={t('contacts.noContactsSubtitle')}
                action={{ label: t('contacts.addContact'), onClick: () => setShowAddForm(true) }}
              />
            </motion.div>
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
        onDelete={() => {}}
        onRequestDelete={() => { if (selectedContact) setConfirmDeleteId(selectedContact.id); }}
        onBlock={() => { if (selectedContact) setContacts(contacts.map(c => c.id === selectedContact.id ? { ...c, isBlocked: true } : c)); setSelectedContact(null); }}
        onEdit={() => { if (selectedContact) { setEditingContact(selectedContact); setShowEditForm(true); } setSelectedContact(null); }}
        onToggleFavorite={(id, isFavorite) => {
          toggleFavorite(id, isFavorite);
          if (selectedContact?.id === id) {
            setSelectedContact({ ...selectedContact, isFavorite });
          }
        }}
      />

      <ConfirmDialog isOpen={confirmDeleteId !== null}
        title={t('contacts.deleteContact')}
        message={t('contacts.confirmDeleteMessage', { name: contacts.find(c => c.id === confirmDeleteId)?.name || '' })}
        confirmLabel={t('contacts.deleteContact')} cancelLabel={t('contacts.close')}
        variant="danger" theme={isDark ? 'dark' : 'light'}
        onConfirm={() => { if (confirmDeleteId) setContacts(contacts.filter(c => c.id !== confirmDeleteId)); setConfirmDeleteId(null); }}
        onCancel={() => setConfirmDeleteId(null)}
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
        onScan={() => { setShowAddForm(false); setIsScanning(true); }}
        t={t}
      />

      {showEditForm && editingContact && (
        <ContactCreateEditModal contact={editingContact} isDark={isDark}
          onClose={() => { setShowEditForm(false); setEditingContact(null); }}
          onSave={handleSaveContact} />
      )}

      <FormModal isOpen={isScanning} onClose={() => setIsScanning(false)}
        title={t('contacts.scanContactQR')} subtitle={t('contacts.scanDescription')}
        icon={Scan} theme={theme} closeTitle={t('contacts.close')}>
          <div className={`w-full aspect-square overflow-hidden relative shadow-inner rounded-xl ${isDark ? "bg-black" : "bg-gray-100"}`}>
           <Scanner onScan={(result) => {
             if (result && result.length > 0) {
               setIsScanning(false); setNewContactId(result[0].rawValue); setShowAddForm(true);
             }
           }} styles={{ container: { width: '100%', height: '100%' } }} />
           <div className="absolute inset-0 border-4 border-[var(--accent)]/50 pointer-events-none mix-blend-overlay rounded-xl" />
         </div>
      </FormModal>

      <FormModal isOpen={showShareId} onClose={() => setShowShareId(false)}
        title={t('contacts.shareIdentity')} subtitle={t('contacts.shareDescription')}
        icon={QrCode} theme={theme} closeTitle={t('contacts.close')}>
        <div className="flex flex-col items-center gap-4 mt-2">
          <div className={`w-[220px] h-[220px] flex items-center justify-center p-4 shadow-xl ${
            isDark ? "bg-white" : "bg-white border-2 border-gray-100"
          }`}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={t('contacts.shareQrAlt', 'Your identity QR code')} className="w-full h-full object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent animate-spin" />
            )}
          </div>
          <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 ${
            isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-slate-50 border border-[var(--border-color)]"
          }`}>
            <div className={`font-mono text-xs tracking-widest break-all text-center ${isDark ? "text-[var(--accent)]" : "text-[var(--accent)]"}`}>
              {shareId}
            </div>
            <div className="flex gap-2 w-full">
              <motion.button whileTap={{ scale: 0.95 }} onClick={copyId}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-bold text-xs transition-colors ${
                  copied ? "bg-green-500 text-[var(--text-primary)]" : (isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-white shadow hover:bg-gray-50 text-slate-800")
                }`}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t('header.copied') : t('contacts.copyId', 'Copy ID')}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-colors ${
                  isDark ? "bg-white/10 hover:bg-white/20 text-[var(--text-primary)]" : "bg-white shadow hover:bg-gray-50 text-slate-800"
                }`}>
                <Share size={14} />
              </motion.button>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
};




