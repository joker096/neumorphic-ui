import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Video, MessageSquare, Ban, Mail, Send, Star, StarOff, ShieldCheck, Bell, BellOff } from 'lucide-react';
import { useAppStore } from '../store';
import { useI18n } from '../lib/i18n';
import { SafetyNumberModal } from './SafetyNumberModal';
import type { ContactField } from '../types/contact';
import { ContactConfirmDialogs, type ContactConfirmAction } from './contact-profile/ContactConfirmDialogs';
import { ContactActionsMenu } from './contact-profile/ContactActionsMenu';
import { ContactAvatarPicker } from './contact-profile/ContactAvatarPicker';
import { formatLastSeen } from './contact-profile/lastSeen';
import { SharedMediaTabs } from './chat/SharedMediaTabs';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { getMasterKeySet } from '../lib/identity/masterKey';
import { getPinnedIdentity } from '../lib/p2p/identityPin';
import { buf2hex } from '../lib/crypto/cryptoCore';

export type ContactProfile = {
  id: string;
  name: string;
  color?: string;
  lastSeen?: number;
  online?: boolean;
  isFavorite?: boolean;
  localFields?: ContactField[];
  callInfo?: {
    time: string;
    type: 'missed' | 'incoming' | 'outgoing' | 'returned';
    duration?: string;
  };
};

type Props = {
  contact: ContactProfile | null;
  myPeerId?: string;
  onClose: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onRequestDelete?: () => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  theme: 'light' | 'dark';
};

export const ContactProfileModal = ({ contact, myPeerId, onClose, onCall, onVideoCall, onMessage, onEdit, onDelete, onBlock, onUnblock, onRequestDelete, onToggleFavorite, theme }: Props) => {
  const ghostViewMode = useAppStore(state => state.ghostViewMode);
  const chats = useAppStore(state => state.chats);
  const contacts = useAppStore(state => state.contacts);
  const setContactMuted = useAppStore(state => state.setContactMuted);
  const setChatMuted = useAppStore(state => state.setChatMuted);
  const setContactBlocked = useAppStore(state => state.setContactBlocked);
  const isDark = theme === 'dark';
  const { t } = useI18n();
  const contactAvatars = useAppStore(state => state.contactAvatars);
  const setContactAvatar = useAppStore(state => state.setContactAvatar);
  const removeContactAvatar = useAppStore(state => state.removeContactAvatar);
  const [confirmAction, setConfirmAction] = useState<ContactConfirmAction | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);
  const [identityHex, setIdentityHex] = useState<string | undefined>(undefined);
  const [peerPinned, setPeerPinned] = useState<string | undefined>(undefined);

  // Resolve the REAL identity keys, not chat ids: the local Ed25519 public key
  // (master identity) and the peer's pinned identity (TOFU-pinned at first
  // verified signaling session). Without both, the safety number cannot be
  // computed and the modal shows an honest "not yet verified" state.
  useEffect(() => {
    let alive = true
    getMasterKeySet()
      .then((keys) => { if (alive) setIdentityHex(buf2hex(keys.ed25519Public)) })
      .catch(() => { /* no master identity yet — modal stays unverified */ })
    return () => { alive = false }
  }, []);

  useEffect(() => {
    let alive = true
    if (!contact?.id) { setPeerPinned(undefined); return }
    getPinnedIdentity(contact.id)
      .then((pinned) => { if (alive) setPeerPinned(pinned) })
      .catch(() => { if (alive) setPeerPinned(undefined) })
    return () => { alive = false }
  }, [contact?.id]);

  useEffect(() => {
    setShowActions(false);
    setConfirmAction(null);
    setShowSafetyNumber(false);
  }, [contact?.id]);

  const overrideAvatar = contact ? contactAvatars[contact.name] : undefined;
  const dmChat = contact ? (chats || []).find((c: any) => c.name === contact.name && c.type !== 'group') : undefined;
  const storeContact = contact ? (contacts || []).find((c: any) => c.id === contact.id) : undefined;
  const blockedContact = contact ? (contacts || []).find((c: any) => c.id === contact.id || c.name === contact.name) : undefined;
  const notificationsOn = storeContact ? !storeContact.muted : dmChat ? !((dmChat as any).muted) : !localMuted;
  const isBlocked = !!blockedContact?.isBlocked;

  const handleDelete = () => { onDelete?.(); onClose(); setConfirmAction(null); };
  const handleBlock = () => { if (blockedContact) setContactBlocked(blockedContact.id, true); onBlock?.(); onClose(); setConfirmAction(null); };
  const handleUnblock = () => { if (blockedContact) setContactBlocked(blockedContact.id, false); onUnblock?.(); onClose(); };
  const handleToggleFavorite = (id: string, currentStatus: boolean) => onToggleFavorite?.(id, !currentStatus);

  return createPortal(
    <AnimatePresence>
      <ContactConfirmDialogs
        action={confirmAction}
        contactName={contact?.name || ''}
        theme={theme}
        t={t}
        onConfirmDelete={handleDelete}
        onConfirmBlock={handleBlock}
        onCancel={() => setConfirmAction(null)}
      />
      {contact && (
        <motion.div
          key="profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
 className={`glass-panel w-full max-w-[340px] md:max-w-[400px] lg:max-w-[440px] p-6 relative flex flex-col items-center`}
          >
            <button
              className={`absolute top-4 right-4 z-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-[var(--text-primary)]' : 'bg-black/5 hover:bg-black/10 text-slate-800'}`}
              onClick={onClose}
              title={t('contacts.close')}
              aria-label={t('contacts.close') || t('common.close')}
            >
              <X size={18} />
            </button>

            {(onDelete || onBlock || onUnblock) && (
              <ContactActionsMenu
                isDark={isDark}
                t={t}
                open={showActions}
                onToggle={() => setShowActions(!showActions)}
                canEdit={!!onEdit}
                canDelete={!!onDelete}
                canBlock={!!onBlock && !isBlocked && !!blockedContact}
                canUnblock={!!onUnblock && isBlocked}
                onEdit={() => { onEdit(); onClose(); setShowActions(false); }}
                onDelete={() => { setConfirmAction('delete'); onRequestDelete?.(); }}
                onBlock={() => setConfirmAction('block')}
                onUnblock={() => { handleUnblock(); setShowActions(false); }}
              />
            )}

            <div className="flex w-full flex-col items-center max-h-[85vh] overflow-y-auto scrollbar-none">
<ContactAvatarPicker
              key={contact.id}
              contact={contact}
              overrideAvatar={overrideAvatar}
              ghostViewMode={ghostViewMode}
              isDark={isDark}
              t={t}
              onSetAvatar={setContactAvatar}
              onRemoveAvatar={removeContactAvatar}
            />
                        <h2 className={`text-xl font-bold mt-3 text-center flex items-center justify-center gap-2 tracking-tight ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"}`}>
              {contact.name}
              <button
                onClick={() => handleToggleFavorite(contact.id, contact.isFavorite || false)}
                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${contact.isFavorite ? (isDark ? "text-yellow-400 bg-white/10" : "text-yellow-500 bg-black/5") : (isDark ? "text-gray-500 hover:text-[var(--text-primary)]" : "text-slate-400 hover:text-slate-800")}`}
                title={contact.isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
                aria-label={contact.isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
                aria-pressed={contact.isFavorite}
              >
                {contact.isFavorite ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
              </button>
            </h2>

            <div className={`mt-1 font-mono text-xs tracking-wider px-3 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
              {contact.id}
            </div>

            {isBlocked && (
              <div className="mt-2 flex items-center gap-1 text-xs font-bold text-red-500">
                <Ban size={12} />
                <span>{t('profile.blocked')}</span>
              </div>
            )}

            <div className={`w-full mt-4 p-4 rounded-2xl flex items-center justify-between ${isDark ? "bg-white/5" : "bg-black/5"}`}>
              <div className="flex items-center gap-2">
                {notificationsOn ? <Bell size={16} className={isDark ? "text-gray-400" : "text-slate-500"} /> : <BellOff size={16} className="text-red-400" />}
                <span className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('profile.notifications')}</span>
              </div>
              <ToggleSwitch isOn={notificationsOn} onToggle={() => (storeContact ? setContactMuted(contact.id, notificationsOn) : dmChat ? setChatMuted(dmChat.id, notificationsOn) : setLocalMuted(v => !v))} className="w-11 h-6" />
            </div>

            {contact.callInfo ? (
              <div className={`mt-4 w-full p-4 rounded-xl flex flex-col items-center gap-1 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                <div className={`text-sm font-semibold capitalize ${contact.callInfo.type === 'missed' ? 'text-red-500' : isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>
                  {t('contacts.callType', { type: contact.callInfo.type })}
                </div>
                <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  {contact.callInfo.time} {contact.callInfo.duration ? `• ${contact.callInfo.duration}` : ''}
                </div>
              </div>
            ) : (contact.online || contact.lastSeen !== undefined) && !ghostViewMode && (
              <div className={`text-xs mt-2 font-medium ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                {formatLastSeen(t, contact.online, contact.lastSeen)}
              </div>
            )}

            {contact.localFields && contact.localFields.length > 0 && (
              <div className={`w-full mt-4 p-4 rounded-2xl flex flex-col gap-2 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  {t('contacts.localInfo')}
                </div>
                {contact.localFields.map(field => (
                  <div key={field.id} className="flex items-center gap-2">
                    {field.type === 'phone' && <Phone size={12} className={isDark ? "text-gray-400" : "text-slate-500"} />}
                    {field.type === 'email' && <Mail size={12} className={isDark ? "text-gray-400" : "text-slate-500"} />}
                    {field.type === 'telegram' && <Send size={12} className={isDark ? "text-gray-400" : "text-slate-500"} />}
                    {field.type === 'custom' && <div className={`w-2 h-2 rounded-full ${isDark ? "bg-gray-500" : "bg-slate-400"}`} />}
                    <span className={`text-xs ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                      {field.label || field.type}: {field.value}
                    </span>
                  </div>
                ))}
                <div className={`text-xs mt-1 ${isDark ? "text-gray-600" : "text-slate-400"}`}>
                  {t('contacts.localFieldsNotShared')}
                </div>
              </div>
            )}

            {dmChat && (
              <div className={`w-full mt-4 p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  {t('profile.sharedMedia')}
                </div>
                <SharedMediaTabs messages={dmChat.history || []} isDark={isDark} onOpenChat={() => { onMessage?.(); onClose(); }} />
              </div>
            )}

            <div className="w-full mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { onCall?.(); onClose(); }} className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${isDark ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20' : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-500/10'}`}>
                  <Phone size={20} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('contacts.call')}</span>
                </button>
                <button onClick={() => { onVideoCall?.(); onClose(); }} className={`h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${isDark ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/20' : 'bg-teal-50 hover:bg-teal-100 text-teal-600 border border-teal-500/10'}`}>
                  <Video size={20} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t('contacts.videoCall')}</span>
                </button>
              </div>
              <button onClick={() => { onMessage?.(); onClose(); }} className={`w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${'bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-[var(--ink-on-saturate)] text-[var(--accent)] border border-[var(--accent-soft)]'}`}>
                <MessageSquare size={20} fill="currentColor" />
                <span className="text-xs font-bold uppercase tracking-wider">{t('contacts.message')}</span>
              </button>
              <button onClick={() => setShowSafetyNumber(true)} title={t('contacts.verifySecurityDesc')} className={`w-full min-h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-black/5 hover:bg-black/10 text-slate-600'}`}>
                <ShieldCheck size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{t('contacts.verifySecurity')}</span>
              </button>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      <SafetyNumberModal
        key="safety"
        open={showSafetyNumber}
        contactId={contact?.id || ''}
        contactName={contact?.name || ''}
        myPeerId={myPeerId ?? identityHex}
        theirPublicKey={peerPinned}
        theme={theme}
        onClose={() => setShowSafetyNumber(false)}
      />
    </AnimatePresence>,
    document.body
  );
};




