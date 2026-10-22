import React, { useEffect, useState } from 'react';
import { modalOverlay } from './ui/modalShared';
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
import { CAPS_LABEL_CLASS, TERTIARY_HINT_CLASS, SECONDARY_CAPTION_CLASS, SECONDARY_TEXT_CLASS, TERTIARY_CAPTION_CLASS } from './ui/textClasses';
import { TWO_COL_GRID_CLASS } from "./ui/gridClasses";
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
  /** Hide the favorite star when no real contact sits behind the profile. */
  canToggleFavorite?: boolean;
  theme: 'light' | 'dark';
};

export const ContactProfileModal = ({ contact, myPeerId, onClose, onCall, onVideoCall, onMessage, onEdit, onDelete, onBlock, onUnblock, onRequestDelete, onToggleFavorite, canToggleFavorite = true, theme }: Props) => {
  const ghostViewMode = useAppStore(state => state.ghostViewMode);
  const chats = useAppStore(state => state.chats);
  const contacts = useAppStore(state => state.contacts);
  const setContactMuted = useAppStore(state => state.setContactMuted);
  const setChatMuted = useAppStore(state => state.setChatMuted);
  const setContactBlocked = useAppStore(state => state.setContactBlocked);
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
          className={modalOverlay}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
 className={`glass-panel w-full max-w-[340px] md:max-w-[400px] lg:max-w-[440px] p-6 relative flex flex-col items-center`}
          >
            <button
              className="absolute top-4 right-4 z-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors bg-[var(--msg-bg-panel)] hover:bg-[var(--msg-bg-panel-hover)] text-[var(--text-primary)]"
              onClick={onClose}
              title={t('contacts.close')}
              aria-label={t('contacts.close') || t('common.close')}
            >
              <X size={18} />
            </button>

            {(onDelete || onBlock || onUnblock) && (
              <ContactActionsMenu
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
              t={t}
              onSetAvatar={setContactAvatar}
              onRemoveAvatar={removeContactAvatar}
            />
                        <h2 className="text-xl font-bold mt-3 text-center flex items-center justify-center gap-2 tracking-tight text-[var(--text-primary)]">
              {contact.name}
              {canToggleFavorite && (
                <button
                  onClick={() => handleToggleFavorite(contact.id, contact.isFavorite || false)}
                  className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${contact.isFavorite ? "text-[var(--amber)] bg-[var(--msg-bg-panel)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"}`}
                  title={contact.isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
                  aria-label={contact.isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
                  aria-pressed={contact.isFavorite}
                >
                  {contact.isFavorite ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                </button>
              )}
            </h2>

            <div className="mt-1 font-mono text-xs tracking-wider px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              {contact.id}
            </div>

            {isBlocked && (
              <div className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--danger)]">
                <Ban size={12} />
                <span>{t('profile.blocked')}</span>
              </div>
            )}

            <div className="w-full mt-4 p-4 rounded-2xl flex items-center justify-between bg-[var(--bg-tertiary)]">
              <div className="flex items-center gap-2">
                {notificationsOn ? <Bell size={16} className="text-[var(--text-secondary)]" /> : <BellOff size={16} className="text-[var(--danger)]" />}
                <span className={SECONDARY_TEXT_CLASS}>{t('profile.notifications')}</span>
              </div>
              <ToggleSwitch isOn={notificationsOn} onToggle={() => (storeContact ? setContactMuted(contact.id, notificationsOn) : dmChat ? setChatMuted(dmChat.id, notificationsOn) : setLocalMuted(v => !v))} className="w-11 h-6" />
            </div>

            {contact.callInfo ? (
              <div className="mt-4 w-full p-4 rounded-xl flex flex-col items-center gap-1 bg-[var(--bg-tertiary)]">
                <div className={`text-sm font-semibold capitalize ${contact.callInfo.type === 'missed' ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
                  {t('contacts.callType', { type: contact.callInfo.type })}
                </div>
                <div className={TERTIARY_CAPTION_CLASS}>
                  {contact.callInfo.time} {contact.callInfo.duration ? `• ${contact.callInfo.duration}` : ''}
                </div>
              </div>
            ) : (contact.online || contact.lastSeen !== undefined) && !ghostViewMode && (
              <div className="text-xs mt-2 font-medium text-[var(--text-tertiary)]">
                {formatLastSeen(t, contact.online, contact.lastSeen)}
              </div>
            )}

            {contact.localFields && contact.localFields.length > 0 && (
              <div className="w-full mt-4 p-4 rounded-2xl flex flex-col gap-2 bg-[var(--bg-tertiary)]">
                <div className="text-xs font-bold uppercase tracking-widest mb-1 text-[var(--text-tertiary)]">
                  {t('contacts.localInfo')}
                </div>
                {contact.localFields.map(field => (
                  <div key={field.id} className="flex items-center gap-2">
                    {field.type === 'phone' && <Phone size={12} className="text-[var(--text-tertiary)]" />}
                    {field.type === 'email' && <Mail size={12} className="text-[var(--text-tertiary)]" />}
                    {field.type === 'telegram' && <Send size={12} className="text-[var(--text-tertiary)]" />}
                    {field.type === 'custom' && <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />}
                    <span className={SECONDARY_CAPTION_CLASS}>
                      {field.label || field.type}: {field.value}
                    </span>
                  </div>
                ))}
                <div className={TERTIARY_HINT_CLASS}>
                  {t('contacts.localFieldsNotShared')}
                </div>
              </div>
            )}

            {dmChat && (
              <div className="w-full mt-4 p-4 rounded-2xl bg-[var(--bg-tertiary)]">
                <div className="text-xs font-bold uppercase tracking-widest mb-2 text-[var(--text-tertiary)]">
                  {t('profile.sharedMedia')}
                </div>
                <SharedMediaTabs messages={dmChat.history || []} onOpenChat={() => { onMessage?.(); onClose(); }} />
              </div>
            )}

            <div className="w-full mt-6 space-y-3">
              <div className={TWO_COL_GRID_CLASS}>
                <button onClick={() => { onCall?.(); onClose(); }} className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 bg-[var(--color-success-soft)] hover:bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[var(--color-success)]/25">
                  <Phone size={20} fill="currentColor" />
                  <span className={CAPS_LABEL_CLASS}>{t('contacts.call')}</span>
                </button>
                <button onClick={() => { onVideoCall?.(); onClose(); }} className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 bg-[var(--blue)]/15 hover:bg-[var(--blue)]/25 text-[var(--blue)] border border-[var(--blue)]/25">
                  <Video size={20} fill="currentColor" />
                  <span className={CAPS_LABEL_CLASS}>{t('contacts.videoCall')}</span>
                </button>
              </div>
              <button onClick={() => { onMessage?.(); onClose(); }} className="w-full h-14 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 bg-[var(--accent-soft)] hover:bg-[var(--accent)] hover:text-[var(--ink-on-saturate)] text-[var(--accent)] border border-[var(--accent-soft)]">
                <MessageSquare size={20} fill="currentColor" />
                <span className={CAPS_LABEL_CLASS}>{t('contacts.message')}</span>
              </button>
              <button onClick={() => setShowSafetyNumber(true)} title={t('contacts.verifySecurityDesc')} className="w-full min-h-11 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 bg-[var(--msg-bg-panel)] hover:bg-[var(--msg-bg-panel-hover)] text-[var(--text-secondary)]">
                <ShieldCheck size={16} />
                <span className={CAPS_LABEL_CLASS}>{t('contacts.verifySecurity')}</span>
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




