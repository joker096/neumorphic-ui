import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { toast } from 'sonner';
import { QrCode, Scan, Users, UserPlus, X, ArrowDownAZ, Clock, Check, Copy, Share, Phone, MessageSquare, Trash2, Edit, Loader2, Search, Star, StarOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ContactProfileModal, ContactProfile } from './ContactProfileModal';
import { ContactCreateEditModal } from './ContactCreateEditModal';
import { ConfirmDialog } from './ui/ConfirmDialog';
import type { Contact, ContactField } from '../types/contact';

type TabOption = 'all' | 'favorites' | 'recent' | 'blocked';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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

  const toggleFavorite = (id: string, currentStatus: boolean) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, isFavorite: !currentStatus } : c));
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactName.trim() && newContactId.trim()) {
       const colors = ["from-teal-400 to-emerald-500", "from-pink-400 to-rose-500", "from-yellow-400 to-orange-500"];
       const color = colors[contacts.length % colors.length];
       setContacts([{ name: newContactName.trim(), id: newContactId.trim(), color, lastSeen: Date.now() }, ...contacts]);
       setNewContactName("");
       setNewContactId("");
       setShowAddForm(false);
    }
  };

  const handleSaveContact = (name: string, id: string, color?: string, localFields?: ContactField[]) => {
    if (editingContact) {
      setContacts(contacts.map(c => c.id === editingContact.id ? { ...c, name, id, color: color || c.color, localFields } : c));
    } else {
      const colors = ["from-teal-400 to-emerald-500", "from-pink-400 to-rose-500", "from-yellow-400 to-orange-500"];
      const newColor = colors[contacts.length % colors.length];
      setContacts([{ name, id, color: newColor, lastSeen: Date.now(), localFields }, ...contacts]);
    }
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingContact(null);
  };

  const copyId = () => {
    navigator.clipboard.writeText("nexus://id/fingerprint").then(() => {
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
    });
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    switch (activeTab) {
      case 'favorites': return c.isFavorite;
      case 'recent': return c.lastSeen > 0;
      case 'blocked': return false;
      default: return true;
    }
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return b.isFavorite ? 1 : -1;
    if (sortBy === 'alpha') {
      return a.name.localeCompare(b.name);
    } else {
      return b.lastSeen - a.lastSeen;
    }
  });

  const tabs: { key: TabOption; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: t('contacts.allTab', { count: contacts.length }), icon: <Users size={14} /> },
    { key: 'favorites', label: t('contacts.favoritesTab', { count: contacts.filter(c => c.isFavorite).length }), icon: <Star size={14} /> },
    { key: 'recent', label: t('contacts.recentTab'), icon: <Clock size={14} /> },
  ];

  return (
    <div data-testid="contacts-container" className={`w-full max-w-[400px] flex-1 flex flex-col items-center rounded-[32px] p-6 mb-8 overflow-y-auto ${isDark ? "bg-[#11141c]/50 border border-white/5 scrollbar-dark" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner scrollbar-light"}`}>
      
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <h2 className={`font-sans text-2xl font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>
          {t('contacts.title')}
        </h2>
        <div className={`flex gap-3 ${isDark ? "text-orange-400" : "text-orange-600"}`}>
          <div onClick={() => { setIsScanning(true); setShowAddForm(false); setShowShareId(false); }} title={t('contacts.scanContactQR')} className="cursor-pointer hover:opacity-80 transition-all active:scale-95">
            <Scan className="cursor-pointer hover:opacity-80 transition-all active:scale-95" size={24} />
          </div>
          <div onClick={() => { setShowShareId(true); setIsScanning(false); setShowAddForm(false); }} title={t('contacts.shareIdentity')} className="cursor-pointer hover:opacity-80 transition-all active:scale-95">
            <QrCode className="cursor-pointer hover:opacity-80 transition-all active:scale-95" size={24} />
          </div>
          <div onClick={() => { setShowAddForm(true); setIsScanning(false); setShowShareId(false); }} title={t('contacts.addContact')} className="cursor-pointer hover:opacity-80 transition-all active:scale-95">
            <UserPlus className="cursor-pointer hover:opacity-80 transition-all active:scale-95" size={24} />
          </div>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="w-full px-2 mb-4">
        {/* Search */}
        <div className="relative mb-3">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
          <input 
            placeholder={t('contacts.searchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none border transition-colors ${isDark ? "bg-[#1a1d24] border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50" : "bg-white border-black/10 text-slate-800 placeholder:text-slate-400 focus:border-blue-500/50"}`}
          />
        </div>

        {/* Tabs */}
        <div className={`flex rounded-full p-1 overflow-x-auto scrollbar-none ${isDark ? "bg-white/5" : "bg-black/5"}`} onWheel={(e) => { e.currentTarget.scrollLeft += e.deltaY; }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? (isDark ? 'bg-white/10 text-white' : 'bg-white shadow text-slate-800') : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700')}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {searchQuery && (
          <div className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-slate-500"}`}>
            {t('contacts.foundResults', { count: filteredContacts.length, total: contacts.length })}
          </div>
        )}
      </div>

      <div className="w-full px-2">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-3"
        >
          <AnimatePresence mode="popLayout">
            {sortedContacts.length === 0 && !showAddForm && !isScanning && !showShareId && (
              <div className={`text-center py-8 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                <p className="text-sm">{t('contacts.noContacts')}</p>
                <p className="text-xs mt-1 opacity-60">{t('contacts.noContactsSubtitle')}</p>
              </div>
            )}
            {sortedContacts.map((c, i) => (
              <motion.div 
                key={c.id} 
                layout
                onClick={() => setSelectedContact(c)}
                variants={itemVariants} 
                initial="hidden"
                animate="show"
                exit="hidden"
                className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all active:scale-95 ${isDark ? "hover:bg-[#1a1d24]" : "hover:bg-white shadow-sm"}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${c.color} text-white font-bold text-lg shadow-md shrink-0`}>
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold truncate ${isDark ? "text-gray-100" : "text-slate-800"}`}>{c.name}</span>
                    {c.isFavorite && <Star size={12} className="text-yellow-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] tracking-wider truncate ${isDark ? "text-gray-500" : "text-slate-400"}`}>{c.id}</span>
                    <span className={`text-[9px] font-bold shrink-0 ${isDark ? "text-gray-600" : "text-slate-400"}`}>
                      &bull; {(() => { const delta = Date.now() - c.lastSeen; return delta < 3600000 ? t('chat.minutesAgo', { count: Math.floor(delta / 60000) || 1 }) : delta < 86400000 ? t('chat.hoursAgo', { count: Math.floor(delta / 3600000) }) : t('chat.daysAgo', { count: Math.floor(delta / 86400000) }); })()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(c.id, c.isFavorite); }}
                  className={`shrink-0 transition-transform active:scale-90 ${c.isFavorite ? (isDark ? 'text-yellow-400' : 'text-yellow-500') : (isDark ? 'text-gray-600' : 'text-slate-300')}`}
                >
                  {c.isFavorite ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modals */}
       <ContactProfileModal 
          contact={selectedContact}
          theme={theme}
          onClose={() => setSelectedContact(null)}
           onCall={() => {
               if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onVideoCall={() => {
               if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
               setSelectedContact(null);
           }}
           onMessage={() => {
              if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
              setSelectedContact(null);
          }}
           onDelete={() => {}}
           onRequestDelete={() => {
               if (selectedContact) {
                 setConfirmDeleteId(selectedContact.id);
               }
           }}
            onBlock={() => {
               if (selectedContact) setContacts(contacts.map(c => c.id === selectedContact.id ? { ...c, isBlocked: true } : c));
               setSelectedContact(null);
           }}
          onEdit={() => {
                if (selectedContact) {
                  setEditingContact(selectedContact);
                  setShowEditForm(true);
                }
                setSelectedContact(null);
            }}
           onToggleFavorite={(id) => toggleFavorite(id, selectedContact?.isFavorite ?? false)}
       />

       <ConfirmDialog
         isOpen={confirmDeleteId !== null}
         title={t('contacts.deleteContact')}
         message={t('contacts.confirmDeleteMessage', { name: contacts.find(c => c.id === confirmDeleteId)?.name || '' })}
         confirmLabel={t('contacts.deleteContact')}
         cancelLabel={t('contacts.close')}
         variant="danger"
         theme={isDark ? 'dark' : 'light'}
         onConfirm={() => {
           if (confirmDeleteId) {
             setContacts(contacts.filter(c => c.id !== confirmDeleteId));
           }
           setConfirmDeleteId(null);
         }}
         onCancel={() => setConfirmDeleteId(null)}
       />

      <AnimatePresence>
        {(showAddForm || isScanning || showShareId || showEditForm) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl relative ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
            >
              <div 
                className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
                onClick={() => { setShowAddForm(false); setIsScanning(false); setShowShareId(false); setShowEditForm(false); setEditingContact(null); }}
                title={t('contacts.close')}
              >
                <X size={18} />
              </div>

              {showAddForm && (
                <form onSubmit={handleAddContact} className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col items-center mb-2">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                      <UserPlus size={32} />
                    </div>
                    <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t('contacts.addContact')}</h3>
                    <p className={`text-xs text-center mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>Enter their name and unique network ID to establish a connection.</p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      autoFocus
                      placeholder={t('contacts.contactName')} 
                      value={newContactName}
                      onChange={e => setNewContactName(e.target.value)}
                      className={`w-full h-12 px-4 rounded-2xl text-sm outline-none border-2 transition-colors ${isDark ? "bg-[#13151b] text-white border-white/10 focus:border-orange-500" : "bg-slate-50 text-slate-800 border-black/5 focus:border-orange-500"}`}
                    />
                    <div className="relative">
                       <input 
                         type="text" 
                         placeholder={t('contacts.networkId')} 
                         value={newContactId}
                         onChange={e => setNewContactId(e.target.value)}
                         className={`w-full h-12 pl-4 pr-12 rounded-2xl text-sm font-mono outline-none border-2 transition-colors ${isDark ? "bg-[#13151b] text-white border-white/10 focus:border-orange-500" : "bg-slate-50 text-slate-800 border-black/5 focus:border-orange-500"}`}
                       />
                       <button 
                         type="button" 
                         onClick={() => { setShowAddForm(false); setIsScanning(true); }}
                         className={`absolute right-2 top-2 bottom-2 w-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
                         title={t('header.scanQR')}
                       >
                         <Scan size={16} />
                       </button>
                    </div>
                  </div>

                  <button type="submit" disabled={!newContactName.trim() || !newContactId.trim()} className={`w-full h-12 rounded-2xl font-bold mt-4 transition-all flex items-center justify-center gap-2 ${(!newContactName.trim() || !newContactId.trim()) ? "opacity-50 cursor-not-allowed text-white/50 bg-gray-500" : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20"}`}>
                     <Check size={18} />
                      {t('contacts.saveContact')}
                   </button>
                 </form>
               )}

              {showEditForm && editingContact && (
                <ContactCreateEditModal
                  contact={editingContact}
                  isDark={isDark}
                  onClose={() => { setShowEditForm(false); setEditingContact(null); }}
                  onSave={handleSaveContact}
                />
              )}

              {isScanning && (
                <div className="flex flex-col items-center mt-4">
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-800"}`}>{t('contacts.scanContactQR')}</h3>
                  <div className={`w-full aspect-square rounded-[32px] overflow-hidden relative shadow-inner ${isDark ? "bg-black" : "bg-gray-100"}`}>
                    <Scanner 
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          setIsScanning(false);
                          setNewContactId(result[0].rawValue);
                          setShowAddForm(true);
                        }
                      }}
                      styles={{ container: { width: '100%', height: '100%' } }}
                    />
                    <div className="absolute inset-0 border-4 border-orange-500/50 rounded-[32px] pointer-events-none mix-blend-overlay"></div>
                  </div>
                  <p className={`text-xs text-center mt-6 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('contacts.scanDescription')}</p>
                </div>
              )}

              {showShareId && (
                <div className="flex flex-col items-center mt-4">
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-800"}`}>{t('contacts.shareIdentity')}</h3>
                  <p className={`text-xs text-center mb-6 px-4 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('contacts.shareDescription')}</p>
                  
                  <div className={`w-[220px] h-[220px] rounded-[32px] flex items-center justify-center p-4 shadow-xl mb-6 ${isDark ? "bg-white" : "bg-white border-2 border-gray-100"}`}>
                      <QrCode size="100%" strokeWidth={1} className="text-black" />
                  </div>
                  
                  <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 ${isDark ? "bg-[#13151b] border border-white/5" : "bg-slate-50 border border-black/5"}`}>
                      <div className={`font-mono text-xs tracking-widest break-all text-center ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                        nexus://id/fingerprint
                      </div>
                      <div className="flex gap-2 w-full">
                         <button onClick={copyId} className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl font-bold text-xs transition-colors ${copied ? "bg-green-500 text-white" : (isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white shadow hover:bg-gray-50 text-slate-800")}`}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? t('header.copied') : t('header.copyLink')}
                         </button>
                         <button className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white shadow hover:bg-gray-50 text-slate-800"}`}>
                            <Share size={14} />
                         </button>
                      </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
